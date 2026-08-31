import asyncio, sys
sys.path.insert(0, '.')

async def test_sectors():
    from app.services.market_service import get_sectors

    class MockDB:
        def query(self, *a): return self
        def filter(self, *a): return self
        def first(self): return None
        def add(self, *a): pass
        def commit(self): pass
        def rollback(self): pass

    db = MockDB()
    result_usa = await get_sectors(db, 'usa')
    print("=== SECTORS (usa) ===")
    for s in result_usa[:3]:
        name = s.get("sector")
        pct = s.get("change_percent")
        print(f"  sector={name}, change_percent={pct}")

    result_in = await get_sectors(db, 'india')
    print("=== SECTORS (india) ===")
    for s in result_in[:3]:
        name = s.get("sector")
        pct = s.get("change_percent")
        print(f"  sector={name}, change_percent={pct}")

    print()
    print("Keys in sector item:", list(result_usa[0].keys()))

asyncio.run(test_sectors())
