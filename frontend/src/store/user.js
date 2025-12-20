import { defineStore } from 'pinia'
import { getUserInfo } from "@/request/user"
const useUserStore = defineStore('user', {
    state: () => {
        const user = getUser();
        let userInfo = null;
        let username = null;
        if (user) {
            userInfo = user;
            username = user.username
        }
        return {
            userInfo,
            username
        }
    },
    actions: {
        getUserInfo() {
            getUserInfo().then(res => {
                this.userInfo = res.data;
                setUser(res.data);
                this.username = res.data.username;
            })
        }
    }
})

export default useUserStore