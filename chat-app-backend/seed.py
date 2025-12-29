import asyncio
import random
from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models, schemas
from app.database import AsyncSessionLocal, engine

fake = Faker()

async def seed_data():
    """
    Populates the database with a set of fake users, rooms, and messages.
    """
    print("--- Starting database seeding ---")
    
    # Crtng tables
    async with engine.begin() as conn:
        # frfreshdb
        await conn.run_sync(models.Base.metadata.create_all)

    db: AsyncSession = AsyncSessionLocal()

    try:
        # 1. Create Users 
        print("Creating 10 fake users...")
        users = []
        for _ in range(10):
            user_in = schemas.UserCreate(name=fake.user_name())
            user = await crud.create_user(db=db, user=user_in)
            users.append(user)
        print(f"✅ Created {len(users)} users.")

        # --- 2. Create Rooms ---
        print("Creating 5 fake rooms...")
        rooms = []
        for i in range(5):

            owner = users[i % len(users)]
            room_in = schemas.RoomCreate(
                name=fake.bs().replace(" ", "-"),
                is_public=True
            )
            room = await crud.create_room(db=db, room=room_in, current_user=owner)
            rooms.append(room)
        print(f"✅ Created {len(rooms)} rooms.")

        # 3. Adding Users to Rooms ---
        print("Adding users to rooms...")
        for room in rooms:
          
            members_to_add = random.sample(users, k=random.randint(2, 5))
            for user in members_to_add:

                await crud.add_user_to_room(db=db, room_id=room.id, user_id=user.id)
        print("✅ Users added to rooms.")

        print("Creating 100 fake messages...")
        messages_count = 0
        for _ in range(100):
            room = random.choice(rooms)
            room_details = await crud.get_room_with_details(db, room.id)
            if room_details and room_details.members:
                author_membership = random.choice(room_details.members)
                author = author_membership.user
                
                message_in = schemas.MessageCreate(
                    content=fake.sentence(nb_words=random.randint(3, 15))
                )
                await crud.create_message(db=db, message=message_in, room_id=room.id, user_id=author.id)
                messages_count += 1
        print(f"✅ Created {messages_count} messages.")

    finally:
        await db.close()
    
    print("\n--- Seeding complete! ---")


if __name__ == "__main__":
    asyncio.run(seed_data())
