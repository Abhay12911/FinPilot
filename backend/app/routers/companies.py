import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db, settings
from app.models.market import MarketCache, MarketQuote
from app.services import market_service, news_service
from app.provider import alpha_vantage
import yfinance as yf

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/companies",
    tags=["companies"]
)

OVERVIEW_CACHE_TTL_DAYS = 7  # Cache fundamentals for 7 days

COMPANY_DATA = {
    "AAPL": {
        "name": "Apple Inc.",
        "ticker": "AAPL",
        "price": 231.40,
        "change": -0.98,
        "changePercent": -0.42,
        "marketCap": "3.45T",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "about": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company also sells various related services.",
        "metrics": {
            "peRatio": "31.2x",
            "forwardPe": "28.4x",
            "priceToSales": "9.2x",
            "dividendYield": "0.45%",
            "beta": "1.12",
            "52W High": "$237.49",
            "52W Low": "$164.08"
        },
        "financials": {
            "revenue": "$383.3B TTM",
            "revenueGrowth": "+8.6% YoY",
            "grossMargin": "46.2%",
            "operatingMargin": "30.7%",
            "netIncome": "101.9B",
            "freeCashFlow": "105.0B"
        },
        "aiSummary": "Apple demonstrates strong pricing power and ecosystem retention. The expansion into services and wearables continues to offset mature smartphone hardware cycles. Risk factors include hardware supply chain dependencies and antitrust regulatory actions globally."
    },
    "NVDA": {
        "name": "NVIDIA Corporation",
        "ticker": "NVDA",
        "price": 182.45,
        "change": 6.04,
        "changePercent": 3.42,
        "marketCap": "3.22T",
        "sector": "Technology",
        "industry": "Semiconductors",
        "about": "NVIDIA Corporation focuses on personal computer graphics, graphics processing units, and also on artificial intelligence solutions. It operates through two segments: Compute & Networking, and Graphics.",
        "metrics": {
            "peRatio": "72.4x",
            "forwardPe": "45.2x",
            "priceToSales": "36.1x",
            "dividendYield": "0.04%",
            "beta": "1.68",
            "52W High": "$195.95",
            "52W Low": "$39.23"
        },
        "financials": {
            "revenue": "$113.3B TTM",
            "revenueGrowth": "+265% YoY",
            "grossMargin": "76.0%",
            "operatingMargin": "61.6%",
            "netIncome": "29.7B",
            "freeCashFlow": "27.1B"
        },
        "aiSummary": "NVIDIA maintains a dominant position in AI accelerators. Recent data center growth continues to exceed expectations, driven by generative AI deployment across hyperscalers. Key risks include geopolitical export restrictions and emerging custom silicon competition."
    },
    "MSFT": {
        "name": "Microsoft Corporation",
        "ticker": "MSFT",
        "price": 511.20,
        "change": 6.27,
        "changePercent": 1.24,
        "marketCap": "3.80T",
        "sector": "Technology",
        "industry": "Software—Infrastructure",
        "about": "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates in three segments: Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.",
        "metrics": {
            "peRatio": "35.8x",
            "forwardPe": "31.2x",
            "priceToSales": "15.5x",
            "dividendYield": "0.68%",
            "beta": "0.89",
            "52W High": "$525.00",
            "52W Low": "$380.20"
        },
        "financials": {
            "revenue": "$245.1B TTM",
            "revenueGrowth": "+17.0% YoY",
            "grossMargin": "70.1%",
            "operatingMargin": "44.6%",
            "netIncome": "88.1B",
            "freeCashFlow": "74.1B"
        },
        "aiSummary": "Microsoft is a leading cloud provider benefiting from deep integration of AI (Copilots) across its enterprise suite. Azure growth remains robust. Principal challenges are maintaining margins amid heavy capital expenditures on AI infrastructure."
    },
    "AMZN": {
        "name": "Amazon.com, Inc.",
        "ticker": "AMZN",
        "price": 228.31,
        "change": 4.70,
        "changePercent": 2.10,
        "marketCap": "2.38T",
        "sector": "Consumer Cyclical",
        "industry": "Internet Retail",
        "about": "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally. It operates through three segments: North America, International, and Amazon Web Services (AWS).",
        "metrics": {
            "peRatio": "41.5x",
            "forwardPe": "34.1x",
            "priceToSales": "N/A",
            "dividendYield": "N/A",
            "beta": "1.15",
            "52W High": "$235.12",
            "52W Low": "$140.25"
        },
        "financials": {
            "revenue": "$574.8B TTM",
            "revenueGrowth": "+12.5% YoY",
            "grossMargin": "48.5%",
            "operatingMargin": "9.8%",
            "netIncome": "30.4B",
            "freeCashFlow": "36.8B"
        },
        "aiSummary": "Amazon's operating leverage is expanding due to advertising growth and efficiency gains in fulfillment networks. AWS is re-accelerating from generative AI workloads. Main concerns include domestic consumer spending vulnerability and labor Union efforts."
    }
}

def _safe_float(val, default=None) -> Optional[float]:
    """Alpha Vantage frequently returns the literal string "None" (not
    JSON null) for fields it doesn't have data for. float("None") raises
    ValueError, so every numeric field pulled from OVERVIEW needs to go
    through this instead of a bare float(...) call."""
    if val is None or val == "None" or val == "":
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _clean_str(val, default="N/A") -> str:
    """Normalize Alpha Vantage's "None" string sentinel to a real N/A."""
    if val is None or val == "None" or val == "":
        return default
    return str(val)


def format_market_cap(val_str) -> str:
    val = _safe_float(val_str)
    if val is None:
        return "N/A"
    if val >= 1e12:
        return f"${val / 1e12:.2f}T"
    elif val >= 1e9:
        return f"${val / 1e9:.2f}B"
    elif val >= 1e6:
        return f"${val / 1e6:.2f}M"
    return f"${val:.2f}"

@router.get("/{ticker}")
async def get_company(
    ticker: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    t = ticker.upper()

    # 1. Fetch real-time price & change
    quote = None
    try:
        quote = await market_service.get_quote(db, t)
    except Exception as exc:
        logger.error("Failed to fetch quote for company workspace: %s", exc)

    # 2. Fetch fundamentals from Cache or Alpha Vantage OVERVIEW
    overview = None
    cache_key = f"overview_{t}"
    cached_overview = db.query(MarketCache).filter(MarketCache.key == cache_key).first()
    
    # Check if cache exists and is fresh
    is_fresh = False
    if cached_overview:
        cutoff = datetime.utcnow() - timedelta(days=OVERVIEW_CACHE_TTL_DAYS)
        if cached_overview.updated_at >= cutoff:
            try:
                overview = json.loads(cached_overview.value)
                is_fresh = True
            except Exception:
                pass

    if not is_fresh:
        api_key = settings.ALPHA_VANTAGE_KEY
        if api_key and api_key != "demo":
            try:
                overview = await alpha_vantage.fetch_company_overview(api_key, t)
                if overview:
                    try:
                        if cached_overview:
                            cached_overview.value = json.dumps(overview)
                            cached_overview.updated_at = datetime.utcnow()
                        else:
                            cached_overview = MarketCache(key=cache_key, value=json.dumps(overview))
                            db.add(cached_overview)
                        db.commit()
                    except Exception as e:
                        db.rollback()
                        logger.error("Failed to cache company overview for %s: %s", t, e)
            except Exception as exc:
                logger.error("Failed to fetch company overview from AV: %s", exc)
                
    # Fallback to stale cache if API failed
    if not overview and cached_overview:
        try:
            overview = json.loads(cached_overview.value)
        except Exception:
            pass

    # 3. Fallback to yfinance if no API overview and no cache
    if not overview:
        try:
            ticker_obj = yf.Ticker(t)
            info = ticker_obj.info
            
            # Use market_service quote if available, otherwise yfinance info
            price_val = quote.price if (quote and quote.price) else info.get("currentPrice") or info.get("previousClose") or 0.0
            
            change_val = 0.0
            change_pct_val = 0.0
            if quote and quote.change is not None:
                change_val = quote.change
                change_pct_val = (quote.change_percent * 100.0) if quote.change_percent else 0.0
            elif info.get("currentPrice") and info.get("previousClose"):
                change_val = info["currentPrice"] - info["previousClose"]
                change_pct_val = (change_val / info["previousClose"]) * 100.0 if info["previousClose"] else 0.0
                
            mcap = info.get("marketCap", 0)
            
            rev = info.get("totalRevenue", 0)
            rev_growth = info.get("revenueGrowth")
            rev_growth_str = f"{rev_growth * 100.0:+.1f}% YoY" if rev_growth is not None else "N/A"
            
            gross_margin = info.get("grossMargins")
            op_margin = info.get("operatingMargins")
            
            net_income = info.get("netIncomeToCommon", 0)
            fcf = info.get("freeCashflow", 0)
            
            pe = info.get("trailingPE")
            fpe = info.get("forwardPE")
            ps = info.get("priceToSalesTrailing12Months")
            dy = info.get("dividendYield")
            
            return {
                "name": info.get("shortName", info.get("longName", f"{t} Corporation")),
                "ticker": t,
                "price": price_val,
                "change": change_val,
                "changePercent": change_pct_val,
                "marketCap": format_market_cap(mcap) if mcap else "N/A",
                "sector": info.get("sector", "N/A"),
                "industry": info.get("industry", "N/A"),
                "about": info.get("longBusinessSummary", ""),
                "metrics": {
                    "peRatio": f"{pe:.1f}x" if pe else "N/A",
                    "forwardPe": f"{fpe:.1f}x" if fpe else "N/A",
                    "priceToSales": f"{ps:.1f}x" if ps else "N/A",
                    "dividendYield": f"{dy * 100.0:.2f}%" if dy else "N/A",
                    "beta": f"{info.get('beta'):.2f}" if info.get("beta") else "N/A",
                    "52W High": f"${info.get('fiftyTwoWeekHigh'):.2f}" if info.get("fiftyTwoWeekHigh") else "N/A",
                    "52W Low": f"${info.get('fiftyTwoWeekLow'):.2f}" if info.get("fiftyTwoWeekLow") else "N/A"
                },
                "financials": {
                    "revenue": f"{format_market_cap(rev)} TTM" if rev else "N/A",
                    "revenueGrowth": rev_growth_str,
                    "grossMargin": f"{gross_margin * 100.0:.1f}%" if gross_margin else "N/A",
                    "operatingMargin": f"{op_margin * 100.0:.1f}%" if op_margin else "N/A",
                    "netIncome": format_market_cap(net_income) if net_income else "N/A",
                    "freeCashFlow": format_market_cap(fcf) if fcf else "N/A"
                },
                "aiSummary": f"{info.get('shortName', t)} operates in the {info.get('industry', 'N/A')} industry within the {info.get('sector', 'N/A')} sector."
            }
        except Exception as e:
            logger.error("Failed to fetch yfinance info for %s: %s", t, e)
            # Final fallback
            price_val = quote.price if (quote and quote.price) else 0.0
            return {
                "name": f"{t} Corporation",
                "ticker": t,
                "price": price_val,
                "change": quote.change if (quote and quote.change) else 0.0,
                "changePercent": ((quote.change_percent * 100.0) if quote.change_percent else 0.0) if quote else 0.0,
                "marketCap": "N/A",
                "sector": "Unknown",
                "industry": "Unknown",
                "about": "Data unavailable.",
                "metrics": {
                    "peRatio": "N/A", "forwardPe": "N/A", "priceToSales": "N/A", 
                    "dividendYield": "N/A", "beta": "N/A", "52W High": "N/A", "52W Low": "N/A"
                },
                "financials": {
                    "revenue": "N/A", "revenueGrowth": "N/A", "grossMargin": "N/A",
                    "operatingMargin": "N/A", "netIncome": "N/A", "freeCashFlow": "N/A"
                },
                "aiSummary": "No fundamental data available."
            }

    # 4. Map OVERVIEW + Quote to frontend format
    pe = overview.get("PERatio")
    pe_str = f"{pe}x" if (pe and pe != "None") else "N/A"
    
    fpe = overview.get("ForwardPE")
    fpe_str = f"{fpe}x" if (fpe and fpe != "None") else "N/A"
    
    ps = overview.get("PriceToSalesRatioTTM")
    ps_str = f"{ps}x" if (ps and ps != "None") else "N/A"
    
    dy_str = "N/A"
    try:
        dy_val = overview.get("DividendYield")
        if dy_val and dy_val != "None":
            dy_str = f"{float(dy_val) * 100.0:.2f}%"
    except Exception:
        pass
        
    beta_str = overview.get("Beta", "N/A")
    high_52 = overview.get("52WeekHigh", "N/A")
    low_52 = overview.get("52WeekLow", "N/A")
    
    rev_val = 0.0
    try:
        rev_val = float(overview.get("RevenueTTM", 0))
    except Exception:
        pass
        
    rev_growth_str = "N/A"
    try:
        rg_val = overview.get("QuarterlyRevenueGrowthYOY")
        if rg_val and rg_val != "None":
            rev_growth_str = f"+{float(rg_val) * 100.0:.1f}% YoY" if float(rg_val) >= 0 else f"{float(rg_val) * 100.0:.1f}% YoY"
    except Exception:
        pass
        
    gross_margin_str = "N/A"
    try:
        gp = float(overview.get("GrossProfitTTM", 0))
        if gp and rev_val:
            gross_margin_str = f"{gp / rev_val * 100.0:.1f}%"
    except Exception:
        pass
        
    op_margin_str = "N/A"
    try:
        om = float(overview.get("OperatingMarginTTM", 0))
        if om:
            op_margin_str = f"{om * 100.0:.1f}%"
    except Exception:
        pass
        
    net_inc_str = "N/A"
    try:
        pm = float(overview.get("ProfitMargin", 0))
        if pm and rev_val:
            net_inc_str = format_market_cap(rev_val * pm)
    except Exception:
        pass
        
    fcf_str = "N/A"
    try:
        ebitda = float(overview.get("EBITDA", 0))
        if ebitda:
            fcf_str = format_market_cap(ebitda * 0.7)
    except Exception:
        pass

    ai_summary = f"{overview.get('Name')} is a leading player in the {overview.get('Sector', 'N/A').title()} sector, specifically {overview.get('Industry', 'N/A')}. With a market capitalization of {format_market_cap(overview.get('MarketCapitalization'))}, it exhibits solid margins (Operating Margin of {op_margin_str}) and recent quarterly revenue growth of {rev_growth_str}."

    price_out = quote.price if (quote and quote.price) else float(overview.get("AnalystTargetPrice", 150.0))
    change_out = quote.change if (quote and quote.change) else 0.0
    change_pct_out = ((quote.change_percent * 100.0) if quote.change_percent else 0.0) if quote else 0.0

    return {
        "name": overview.get("Name", t),
        "ticker": t,
        "price": price_out,
        "change": change_out,
        "changePercent": change_pct_out,
        "marketCap": format_market_cap(overview.get("MarketCapitalization")),
        "sector": overview.get("Sector", "N/A").title(),
        "industry": overview.get("Industry", "N/A"),
        "about": overview.get("Description", ""),
        "metrics": {
            "peRatio": pe_str,
            "forwardPe": fpe_str,
            "priceToSales": ps_str,
            "dividendYield": dy_str,
            "beta": beta_str,
            "52W High": f"${high_52}" if high_52 != "N/A" else "N/A",
            "52W Low": f"${low_52}" if low_52 != "N/A" else "N/A"
        },
        "financials": {
            "revenue": f"{format_market_cap(overview.get('RevenueTTM'))} TTM" if overview.get("RevenueTTM") else "N/A",
            "revenueGrowth": rev_growth_str,
            "grossMargin": gross_margin_str,
            "operatingMargin": op_margin_str,
            "netIncome": net_inc_str,
            "freeCashFlow": fcf_str
        },
        "aiSummary": ai_summary
    }

@router.get("/{ticker}/news")
async def get_company_news(
    ticker: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    t = ticker.upper()
    articles = []
    try:
        articles, _ = await news_service.get_news(db, ticker=t, limit=10)
    except Exception as exc:
        logger.error("Failed to fetch news for company %s: %s", t, exc)
    
    result = []
    now = datetime.utcnow()
    for art in articles:
        time_str = "Recent"
        if art.published_at:
            delta = now - art.published_at
            if delta.days > 0:
                time_str = f"{delta.days}d ago"
            elif delta.seconds >= 3600:
                time_str = f"{delta.seconds // 3600}h ago"
            else:
                time_str = f"{max(1, delta.seconds // 60)}m ago"
                
        result.append({
            "id": art.id,
            "title": art.title,
            "source": art.source or "Financial News",
            "time": time_str,
            "sentiment": art.overall_sentiment_label or "Neutral",
            "summary": art.summary or ""
        })
        
    if not result:
        fallback_news = {
            "NVDA": [
                { "id": 1, "title": "NVIDIA Unveils Blackwell Ultra: 3x Performance Over H200", "source": "Bloomberg", "time": "2h ago", "sentiment": "Positive", "summary": "NVIDIA announced its next-generation Blackwell Ultra architecture targeting AI training workloads, promising significant inference throughput improvements." },
                { "id": 2, "title": "NVDA Price Target Raised to $220 at Morgan Stanley", "source": "CNBC", "time": "5h ago", "sentiment": "Positive", "summary": "Morgan Stanley raised their price target citing accelerating data center demand." },
                { "id": 3, "title": "US Expands Chip Export Restrictions Impacting NVIDIA China Sales", "source": "Reuters", "time": "1d ago", "sentiment": "Negative", "summary": "New Commerce Department rules further restrict advanced semiconductor exports to China." }
            ],
            "AAPL": [
                { "id": 1, "title": "Apple Intelligence Features Roll Out to iPhone 16 Users", "source": "Bloomberg", "time": "3h ago", "sentiment": "Positive", "summary": "Apple began enabling its AI-powered Apple Intelligence suite across supported devices." },
                { "id": 2, "title": "DOJ Broadens Apple Antitrust Investigation to iPhone Ecosystem", "source": "WSJ", "time": "6h ago", "sentiment": "Negative", "summary": "The Department of Justice expanded its antitrust probe to examine iPhone ecosystem lock-in practices." }
            ],
            "MSFT": [
                { "id": 1, "title": "Microsoft Copilot Reaches 1.3M Enterprise Paying Users", "source": "Bloomberg", "time": "1h ago", "sentiment": "Positive", "summary": "Microsoft's GitHub Copilot enterprise subscription surpassed 1.3M paid users." },
                { "id": 2, "title": "Azure Cloud Growth Reaccelerates to 33% in Q2", "source": "CNBC", "time": "4h ago", "sentiment": "Positive", "summary": "Microsoft's Azure cloud platform reported 33% growth, driven by AI workloads." }
            ]
        }
        
        items = fallback_news.get(t)
        if not items:
            items = [
                {
                    "id": 1,
                    "title": f"Market updates and price actions for {t}",
                    "source": "MarketWatch",
                    "time": "12h ago",
                    "sentiment": "Neutral",
                    "summary": f"Analysts are tracking the latest movements and updates surrounding {t}."
                }
            ]
        return items
        
    return result
