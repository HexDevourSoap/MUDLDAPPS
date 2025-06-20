<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../store/auth";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

const authStore = useAuthStore();
const computers = ref([]);
const selectedComputers = ref([]);
const title = ref("");
const description = ref("");

const fetchComputers = async () => {
    try {
        const response = await api.get(`/computers`);
        computers.value = response.data.computers;
    } catch (error) {
        console.error("Failed to fetch computers:", error);
    }
};

const toggleComputerSelection = (computerId) => {
    const index = selectedComputers.value.indexOf(computerId);
    if (index === -1) {
        selectedComputers.value.push(computerId);
    } else {
        selectedComputers.value.splice(index, 1);
    }
};

const submitIssue = async () => {
    if (!title.value || !description.value || selectedComputers.value.length === 0) {
        alert("Lūdzu aizpildiet visus laukus un izvēlieties vismaz vienu datoru.");
        return;
    }

    const userId = jwtDecode(authStore.token)?.user_id;
    if (!userId) {
        alert("Nevarēja iegūt lietotāja ID. Lūdzu, ielogojieties vēlreiz.");
        return;
    }

    try {
        await api.post(`/issues`, {
            user_id: userId,
            title: title.value,
            description: description.value,
            status: "open",
            computer_ids: selectedComputers.value,
        });

        alert("Problēma veiksmīgi pieteikta!");
        selectedComputers.value = [];
        title.value = "";
        description.value = "";
    } catch (error) {
        console.error("Failed to submit issue:", error);
        alert("Neizdevās pieteikt problēmu.");
    }
};

onMounted(fetchComputers);
</script>

<template>
    <h1 v-if="authStore.currentRole=='administrators'">Jūsu lomai nav piekļuves šai lapai.</h1>
    <div v-if="authStore.currentRole!='administrators'" class="request-container">
        <h1>Pieteikt problēmu</h1>

        <label>Izvēlieties datorus:</label>
        <div class="computer-list">
            <div v-for="computer in computers" :key="computer.computer_id" class="computer-item"
                :class="{ selected: selectedComputers.includes(computer.computer_id) }"
                @click="toggleComputerSelection(computer.computer_id)">
                {{ computer.computer_name }}
            </div>
        </div>

        <label>Nosaukums:</label>
        <input type="text" v-model="title" placeholder="Problēmas nosaukums" required />

        <label>Apraksts:</label>
        <textarea v-model="description" placeholder="Detalizēts apraksts" required></textarea>

        <button @click="submitIssue">Pieteikt problēmu</button>
    </div>
</template>

<style scoped>
.request-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background: #f9f9f9;
}

label {
    display: block;
    margin-top: 10px;
    font-weight: bold;
}

.computer-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 10px;
}

.computer-item {
    padding: 15px;
    border: 2px solid #ccc;
    text-align: center;
    cursor: pointer;
    background: #f0f0f0;
    transition: all 0.2s ease-in-out;
    border-radius: 8px;
}

.computer-item:hover {
    background: #e0e0e0;
}

.computer-item.selected {
    background: #f44336;
    color: white;
    border-color: #c62828;
}

input,
textarea,
button {
    display: block;
    width: 100%;
    margin-bottom: 10px;
    padding: 8px;
}

button {
    background: #f44336;
    color: white;
    border: none;
    cursor: pointer;
}

button:hover {
    background: #d32f2f;
}
</style>
