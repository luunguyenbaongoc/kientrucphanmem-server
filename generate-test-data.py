import requests
import random

# Base URL of the API
BASE_URL = "http://localhost:3000"
MY_PHONE = "0339812468"
MY_ACCESS_TOKEN = None
MY_REFRESH_TOKEN = None
MY_ID = None


def headers(token: str):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }


def get_data(endpoint, token):
    url = f"{BASE_URL}/{endpoint}"
    response = requests.get(url, headers=headers(token))
    if response.status_code == 200:
        return response.json()
    else:
        print(f"GET request failed: {response.status_code}")
        return None


def post_data(endpoint, data, token=None):
    header = headers(token) if token is not None else None
    url = f"{BASE_URL}/{endpoint}"
    response = requests.post(url, json=data, headers=header)
    if response is not None:
        return response.json()
    else:
        print(f"POST request failed: {response.status_code}")
        return None


def delete_data(endpoint, resource_id, token):
    url = f"{BASE_URL}/{endpoint}/{resource_id}"
    response = requests.delete(url, headers=headers(token))
    if response.status_code == 204:
        print("DELETE request successful")
        return True
    else:
        print(f"DELETE request failed: {response.status_code}")
        return False


if __name__ == "__main__":
    response = post_data("auth/register", {
        "phone": MY_PHONE,
        "password": "sinhpham123",
        "fullname": "Sinh Pham"
    })
    MY_ID = response['user']['id']
    print('MY ID: ', MY_ID)
    response = post_data("auth/login", {
        "phone": MY_PHONE,
        "password": "sinhpham123",
    })
    MY_ACCESS_TOKEN = response['access_token']
    print("My access token: ", MY_ACCESS_TOKEN)
    MY_REFRESH_TOKEN = response['refresh_token']
    print("My refresh token: ", MY_REFRESH_TOKEN)

    # Register more user as friends
    phones = [
        "111111111",
        "222222222",
        "333333333",
        "444444444",
        "555555555",
        "666666666",
        "777777777",
        "888888888",
        "999999999",
        "832189983",
        "808300340",
        "909090909",
        "123456789",
        "987654321",
        "543219876",
        "321654987",
        "655409932"
    ]
    password = "test-user-123"
    # -----------------------------REGISTER USERS-----------------------------------#
    registered_user_ids = []
    for idx, phone in enumerate(phones, start=1):
        response = post_data("auth/register", {
            "phone": phone,
            "password": password,
            "fullname": f"Test User {idx}"
        })
        if response is not None:
            if response['is_success']:
                registered_user_ids.append(response['user']['id'])
    # ----------------------------------------------------------------#

    # ------------MAKE FRIENDS ----------------------------------------------------#
    # Make friends with 10 users
    my_friend_user_ids = []
    for index, phone in enumerate(phones[:10]):
        response = post_data("friend-request", {
            "to_user_phone": phone
        }, MY_ACCESS_TOKEN)
        friend_request_id = response['id']
        if response is not None:
            response = post_data("auth/login", {
                "phone": phone,
                "password": password
            })
            if response is not None:
                if index < 5:
                    friend_access_token = response['access_token']
                    friend_refresh_token = response['refresh_token']
                    response = get_data(f"friend-request/accept/{friend_request_id}", friend_access_token)
                    if response is not None:
                        print(f"User with phone: {phone} accepted your request: {friend_request_id}")
                        my_friend_user_ids.append(response['to_user'])

    # Other user send request to me
    for index, phone in enumerate(phones[10:]):
        response = post_data("auth/login", {
            "phone": phone,
            "password": password
        })
        if response is not None:
            friend_access_token = response['access_token']
            friend_refresh_token = response['refresh_token']
            response = post_data("friend-request", {
                "to_user_phone": MY_PHONE
            }, friend_access_token)
            friend_request_id = response['id']
            if index < 5:
                # just accept 5 people
                response = get_data(f"friend-request/accept/{friend_request_id}", MY_ACCESS_TOKEN)
                if response is not None:
                    print("I accepted request of user : {phone}")
                    my_friend_user_ids.append(response['from_user'])
    # ----------------------------------------------------------------#

    # --------------------------CREATE GROUPS--------------------------------------#
    # Create 3 groups
    for i in range(3):
        response = post_data("group", {
            "name": f'Group {i + 1}'
        }, MY_ACCESS_TOKEN)
        if response is not None:
            group_id = response['id']
            print(f'Created group {group_id}')
            num_member = random.randint(1, len(my_friend_user_ids))
            group_members = random.sample(my_friend_user_ids, num_member)
            response = post_data("group-members", {
                "group_id": group_id,
                "user_ids": group_members
            }, MY_ACCESS_TOKEN)
            if response is not None:
                print(f'Added {num_member} members to group {group_id}')
