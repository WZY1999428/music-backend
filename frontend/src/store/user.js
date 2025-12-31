import { defineStore } from 'pinia'
import { getUserInfo } from "@/request/user"
export const useUserStore = defineStore('user', () => {
    const user = getUser();
    const userInfo = ref(null);
    const username = ref(null);
    if (user) {
        userInfo.value = user;
        username.value = user.username
    }
    function fetchUserInfo() {
        getUserInfo().then(res => {
            userInfo.value = res.data;
            setUser(res.data);
            username.value = res.data.username;
        })
    }
    return { userInfo, username, fetchUserInfo }
})
