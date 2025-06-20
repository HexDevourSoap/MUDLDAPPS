<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../store/auth";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

const authStore = useAuthStore();
const computers = ref([]);
const selectedComputers = ref([]);
const requestInfo = ref("");
const timeSlots = ref([{fromTime: "", toTime: ""}]);

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

const addTimeSlot = () => {
    timeSlots.value.push({ fromTime: "", toTime: "" });
};

const removeTimeSlot = (index) => {
    if (timeSlots.value.length > 1) {
        timeSlots.value.splice(index, 1);
    }
};

const submitRequest = async () => {
    if (selectedComputers.value.length === 0 || timeSlots.value.some(slot => !slot.fromTime || !slot.toTime)) {
        alert("Lūdzu izvēlieties vismaz vienu datoru un laikus.");
        return;
    }
    // Get user_id dynamically from authStore
    const userId = jwtDecode(authStore.token)?.user_id;
    if (!userId) {
        alert("Nevarēja iegūt lietotāja ID. Lūdzu, ielogojieties vēlreiz.");
        return;
    }
    try {
        // create request
        const requestResponse = await api.post(`/requests`, {
            user_id: userId,
            information: requestInfo.value,
            status: "pending"
        });
        
        const requestId = requestResponse.data.request_id;
        
        // create reservation for each computer
        for (const computerId of selectedComputers.value) {
            for (const { fromTime, toTime } of timeSlots.value) {
                await api.post(`/reservations`, {
                    computer_id: computerId,
                    request_id: requestId,
                    from_time: fromTime,
                    to_time: toTime
                });
            }
        }

        alert("Pieprasījums veiksmīgi iesniegts!");
        selectedComputers.value = [];
        requestInfo.value = "";
        timeSlots.value = [{ fromTime: "", toTime: "" }];
    } catch (error) {
        console.error("Failed to submit request:", error);
        alert("Neizdevās iesniegt pieprasījumu.");
    }
};

onMounted(fetchComputers);
</script>

<template>
    <h1 v-if="authStore.currentRole!='lietotājs'">Jūsu lomai nav piekļuves šai lapai.</h1>
    <div v-if="authStore.currentRole=='lietotājs'" class="request-container">
        <h1>Pieteikšanās resursu lietošanai</h1>
        
        <label>Izvēlieties datorus:</label>
        <div class="computer-list">
            <div 
                v-for="computer in computers" 
                :key="computer.computer_id"
                class="computer-item"
                :class="{ selected: selectedComputers.includes(computer.computer_id) }"
                @click="toggleComputerSelection(computer.computer_id)"
            >
                {{ computer.computer_name }}
            </div>
        </div>

        <label>Izvēlieties laikus:</label>
        <div v-for="(slot, index) in timeSlots" :key="index" class="time-slot">
            <input type="datetime-local" v-model="slot.fromTime" required />
            <input type="datetime-local" v-model="slot.toTime" required />
            <button @click="removeTimeSlot(index)" v-if="timeSlots.length > 1">Noņemt</button>
        </div>
        <button @click="addTimeSlot">Pievienot vēl laikus</button>

        <label>Komentārs:</label>
        <textarea v-model="requestInfo" placeholder="Papildu informācija"></textarea>

        <button @click="submitRequest">Iesniegt pieprasījumu</button>
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
    background: #4caf50;
    color: white;
    border-color: #388e3c;
}

input, textarea, button {
    display: block;
    width: 100%;
    margin-bottom: 10px;
    padding: 8px;
}

button {
    background: #4caf50;
    color: white;
    border: none;
    cursor: pointer;
}

.time-slot {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

button:hover {
    background: #45a049;
}
</style>
