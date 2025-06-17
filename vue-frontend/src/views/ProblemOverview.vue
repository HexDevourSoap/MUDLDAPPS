<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../store/auth";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

const authStore = useAuthStore();
const issues = ref([]);
const statuses = ["pending", "solved", "unsolved"];
const selectedStatus = ref("pending");
const filteredIssues = ref([]);
const isModalOpen = ref(false);
const selectedIssue = ref(null);
const comments = ref([]);
const newComment = ref("");

const fetchIssues = async () => {
    try {
        const response = await api.get(`/issues`);
        issues.value = response.data.issues;
        filterIssues();
    } catch (error) {
        console.error("Failed to fetch issues:", error);
    }
};

const fetchComments = async () => {
    try {
        const res = await api.get(`/issues/${selectedIssue.value.issue_id}/comments`);
        comments.value = res.data.comments;
    } catch (err) {
        console.error("Failed to load comments:", err);
    }
};

const submitComment = async () => {
    if (!newComment.value.trim()) return;
    const userId = jwtDecode(authStore.token)?.user_id;
    if (!userId) {
        alert("Nevarēja iegūt lietotāja ID. Lūdzu, ielogojieties vēlreiz.");
        return;
    }
    try {
        // await api.addIssueComment(selectedIssue.value.issue_id, newComment.value.trim());
        await api.post(`/issues/${selectedIssue.value.issue_id}/comments`,{
            user_id: userId,
            comment: newComment.value.trim()
        }); 
        newComment.value = "";
        await fetchComments();
    } catch (err) {
        console.error("Failed to add comment:", err);
        alert("Neizdevās pievienot komentāru.");
    }
};

const filterIssues = () => {
    if (selectedStatus.value === "all") {
        filteredIssues.value = issues.value;
    } else {
        filteredIssues.value = issues.value.filter(issue => issue.status === selectedStatus.value);
    }
};

const openModal = async (issue) => {
    try {
        const response = await api.get(`/issues/${issue.issue_id}`);
        selectedIssue.value = {
            ...response.data.issue,
            computers: response.data.computers,
        };
        await fetchComments();
        isModalOpen.value = true;
    } catch (error) {
        console.error("Failed to load issue details:", error);
        alert("Neizdevās ielādēt problēmas datus.");
    }
};


const closeModal = () => {
    isModalOpen.value = false;
    selectedIssue.value = null;
};

const updateIssue = async () => {
    try {
        await api.put(`/issues/${selectedIssue.value.issue_id}/status`, {
            status: selectedIssue.value.status
        });

        for (const comp of selectedIssue.value.computers) {
            await api.put(`/issues/${selectedIssue.value.issue_id}/computer/${comp.computer_id}`, {
                status: comp.status
            });
        }

        const index = issues.value.findIndex(i => i.issue_id === selectedIssue.value.issue_id);
        if (index !== -1) {
            issues.value[index].status = selectedIssue.value.status;
        }

        alert("Izmaiņas saglabātas!");
        closeModal();
    } catch (error) {
        console.error("Failed to update issue:", error);
        alert("Neizdevās saglabāt izmaiņas.");
    }
};

onMounted(fetchIssues);
</script>

<template>
    <div class="issue-container">
        <h1>Problēmu pārskats</h1>

        <div class="filter-container">
            <label for="statusFilter">Filtrēt pēc statusa:</label>
            <select id="statusFilter" v-model="selectedStatus" @change="filterIssues">
                <option value="all">Visi</option>
                <option v-for="status in statuses" :key="status" :value="status">
                    {{ status }}
                </option>
            </select>
        </div>

        <table>
            <thead>
                <tr>
                    <th>E-pasts</th>
                    <th>Nosaukums</th>
                    <th>Izveidots</th>
                    <th>Statuss</th>
                    <th v-if="authStore.currentRole=='laborants'">Darbība</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="issue in filteredIssues" :key="issue.issue_id">
                    <td>{{ issue.email }}</td>
                    <td>{{ issue.title }}</td>
                    <td>{{ new Date(issue.created_at).toLocaleString() }}</td>
                    <td>{{ issue.status }}</td>
                    <td v-if="authStore.currentRole=='laborants'"><button @click="openModal(issue)">Rediģēt</button></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div v-if="isModalOpen" class="modal">
        <div class="modal-content">
            <h2>Rediģēt problēmu</h2>
            <p><strong>E-pasts:</strong> {{ selectedIssue.email }}</p>
            <p><strong>Izveidots:</strong> {{ new Date(selectedIssue.created_at).toLocaleString() }}</p>
            <p><strong>Nosaukums:</strong> {{ selectedIssue.title }}</p>
            <p><strong>Apraksts:</strong> {{ selectedIssue.description }}</p>

            <label for="issue-status">Kopējais statuss:</label>
            <select v-model="selectedIssue.status" id="issue-status">
                <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
            </select>

            <h3>Datoru statusi</h3>
            <ul>
                <li v-for="comp in selectedIssue.computers" :key="comp.computer_id">
                    {{ comp.computer_name }}:
                    <select v-model="comp.status">
                        <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
                    </select>
                </li>
            </ul>

            <h3>Komentāri</h3>
            <div class="comments-section">
                <div v-for="(c, idx) in comments" :key="idx" class="comment">
                    <p><strong>{{ c.email }}</strong> <em>{{ new Date(c.created_at).toLocaleString() }}</em></p>
                    <p>{{ c.comment }}</p>
                </div>

                <textarea v-model="newComment" placeholder="Pievieno komentāru..." rows="3"
                    style="width: 100%; margin-top: 10px;"></textarea>
                <button @click="submitComment" style="margin-top: 5px;">Pievienot komentāru</button>
            </div>

            <div class="modal-actions">
                <button @click="updateIssue">Saglabāt</button>
                <button @click="closeModal">Aizvērt</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.issue-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.filter-container {
    margin-bottom: 10px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

th {
    background-color: #f4f4f4;
}

button {
    background: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: white;
    padding: 20px;
    border-radius: 5px;
    min-width: 400px;
    max-width: 600px;
}

.modal-actions {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
}

.comments-section {
    margin-top: 20px;
    background: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
}

.comment {
    border-bottom: 1px solid #ccc;
    padding-bottom: 5px;
    margin-bottom: 5px;
}
</style>
