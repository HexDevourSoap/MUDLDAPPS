<template>
  <div>
    <nav  v-if="authStore.token">
      <router-link to="/computers_overview">Datoru pārskats </router-link> |
      <router-link to="/reservation_overview">Apskatīt resursu aizņemtības pārskatu </router-link> |
      <router-link v-if="authStore.currentRole=='lietotājs'" to="/resource_request">Pieteikšanās resursu lietošanai </router-link> |
      <router-link v-if="authStore.currentRole=='pārvaldnieks' || authStore.currentRole=='laborants'" to="/request_overview">Rezervāciju veidošana <span v-if="authStore.currentRole=='pārvaldnieks' && pendingRequestsCount > 0" style="color: red; font-weight: bold;">
      (Neapstiprināti: {{ pendingRequestsCount }})
      </span> </router-link> |
      <router-link v-if="authStore.currentRole=='laborants' || authStore.currentRole=='administrators' || authStore.currentRole=='pārvaldnieks'" to="/problem_overview">Problēmu pārskats <span v-if="authStore.currentRole=='pārvaldnieks' && pendingCount > 0" style="color: red; font-weight: bold;">
      (Neapstiprinātas: {{ pendingCount }})
      </span> </router-link> |
      <router-link v-if="authStore.currentRole!='administrators'" to="/report_problem">Pieteikt problēmu </router-link> |
      <router-link v-if="authStore.currentRole=='administrators'" to="/user_overview">Lietotāju pārvaldība </router-link> | 
      <button v-if="authStore.token" @click="logoutAndRedirect">Logout</button>
      <select v-if="authStore.roles && authStore.roles.length > 1" v-model="authStore.currentRole">
      <option v-for="role in authStore.roles" :key="role" :value="role">{{ role }}</option>
      </select>
    </nav>
    <router-view />
  </div>
</template>

<script>
import { useAuthStore } from "./store/auth";
import { useRouter } from "vue-router"; 
import { ref, onMounted, watch } from "vue";
import api from "./services/api";

export default {
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const pendingCount = ref(0);
    const pendingRequestsCount = ref(0);

    const fetchPendingIssues = async () => {
      try {
        const response = await api.get("/issues");
        pendingCount.value = response.data.issues.filter(i => i.status === "pending").length;
      } catch (error) {
        pendingCount.value = 0;
      }
    };

    const fetchPendingRequests = async () => {
      try {
        const response = await api.get("/requests");
        // Ja backend atgriež masīvu
        pendingRequestsCount.value = response.data.filter(r => r.status === "pending").length;
      } catch (error) {
        pendingRequestsCount.value = 0;
      }
    };

    onMounted(() => {
      if (authStore.token && authStore.currentRole === "pārvaldnieks") {
        fetchPendingIssues();
        fetchPendingRequests();
      }
    });

    watch(() => authStore.currentRole, (newRole) => {
    if (authStore.token && newRole === "pārvaldnieks") {
      fetchPendingIssues();
      fetchPendingRequests();
    }
    });

    const logoutAndRedirect = () => {
      authStore.logout();
      router.push("/login"); 
    };

  return { authStore, logoutAndRedirect, pendingCount, pendingRequestsCount };
  }
};
</script>