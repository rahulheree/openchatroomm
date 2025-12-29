from locust import HttpUser, task, between
import random

class ChatAppUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        username = f"loadtest_user_{random.randint(1, 10000)}"
        #  Corrected prefix
        response = self.client.post(
            "/api/v1/session/start",
            json={"name": username}
        )
        if response.status_code == 200:
            print(f"User {username} logged in successfully.")
        else:
            print(f"Failed to log in user {username}. Status: {response.status_code}, Response: {response.text}")

    @task(5)
    def view_community_rooms(self):
        #  Corrected prefix
        self.client.get("/api/v1/rooms/community")

    @task(1)
    def view_userspace_rooms(self):
        #  Corrected prefix
        self.client.get("/api/v1/rooms/userspaces")