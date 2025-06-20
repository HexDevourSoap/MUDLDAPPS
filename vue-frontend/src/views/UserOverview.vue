<script setup>
import { ref, onMounted, computed } from 'vue';
import bcrypt from 'bcryptjs';
import api from "../services/api";
import { useAuthStore } from "../store/auth";

const users = ref([]);
const roles = ref([]);
const selectedRole = ref('');
const searchQuery = ref('');
const showEditModal = ref(false);
const showCreateModal = ref(false);
const selectedUser = ref(null);
const selectedUserRoles = ref([]);
const newUser = ref({ email: '', user_type: 'Local', username: '', password: '', phone_number: '', is_active: true, roles: [] });
const authStore = useAuthStore();

const openEditModal = (user) => {
  selectedUser.value = { ...user };
  //selectedUserRoles.value = user.roles.split(',');
  if(user.roles.length > 0){
    selectedUserRoles.value = user.roles.split(',');
  }else{
    selectedUserRoles.value = [];
  }

  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedUser.value = null;
  selectedUserRoles.value = [];
};

const openCreateModal = () => {
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  newUser.value = { email: '', user_type: 'Local', username: '', password: '', phone_number: '', is_active: true, roles: [] };
};

const fetchUsers = async () => {
  try {
    const response = await api.get(`/users`);
    users.value = response.data.map(user => ({
      ...user,
      roles: user.roles ? user.roles : [],
      is_active: !!user.is_active, // ensures it's a boolean
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

const fetchRoles = async () => {
  try {
    const response = await api.get(`/roles`);
    roles.value = response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
  }
};

async function addRole(userId, roleId) {
  await api.post(`/user_roles/assign`, { userId, roleId });
}

async function removeRole(userId, roleId) {
  await api.delete(`/user_roles/remove`, { data: { userId, roleId } });
}

const saveUserRoles = async () => {
  if (!selectedUser.value) return;
  try {
    const roleMap = Object.fromEntries(roles.value.map(role => [role.name, role.role_id]));

    //const originalRoles = selectedUser.value.roles.split(',');
    let originalRoles;
    if(selectedUser.value.roles.length){
      originalRoles = selectedUser.value.roles.split(',');
    }else{
      originalRoles = [];
    }

    const rolesToAdd = selectedUserRoles.value.filter(role => !selectedUser.value.roles.includes(role));
    const rolesToRemove = originalRoles.filter(role => !selectedUserRoles.value.includes(role));

    for (const role of rolesToAdd) {
      const roleId = roleMap[role];

      if (roleId) 
        await addRole(selectedUser.value.user_id, roleId);
    }

    for (const role of rolesToRemove) {
      const roleId = roleMap[role];

      if (roleId) 
        await removeRole(selectedUser.value.user_id, roleId);
    }
    await api.put(`/users/${selectedUser.value.user_id}`, {
      phone_number: selectedUser.value.phone_number,
      is_active: selectedUser.value.is_active
    });
    selectedUser.value.roles = [...selectedUserRoles.value];
    closeEditModal();
    fetchUsers();
    fetchRoles();
  } catch (error) {
    console.error("Error saving user roles:", error);
  }
};

const saveNewUser = async () => {
  try {
    let userId;
    const userResponse = await api.post(`/users`, {
      email: newUser.value.email,
      user_type: newUser.value.user_type,
      phone_number: newUser.value.phone_number,
      is_active: newUser.value.is_active,
    });

    if (userResponse.data.user_id) {
      userId = userResponse.data.user_id;

      if (newUser.value.user_type === 'Local') {
        const hashedPassword = await bcrypt.hash(newUser.value.password, 10);
        await api.post(`/local_users`, {
          user_id: userId,
          username: newUser.value.username,
          password_hash: hashedPassword,
        });
      }

      for (const role of newUser.value.roles) {
        const roleId = roles.value.find(r => r.name === role)?.role_id;
        if (roleId) {
          await addRole(userId, roleId);
        }
      }
    }
    closeCreateModal();
    fetchUsers();
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

const toggleRole = (roleName) => {
  if (!selectedUser.value) return;

  if (selectedUserRoles.value.includes(roleName)) {
    selectedUserRoles.value = selectedUserRoles.value.filter(r => r !== roleName);
  } else {
    selectedUserRoles.value.push(roleName);
  }
};

const toggleNewUserRole = (roleName) => {
  if (newUser.value.roles.includes(roleName)) {
    newUser.value.roles = newUser.value.roles.filter(r => r !== roleName);
  } else {
    newUser.value.roles.push(roleName);
  }
};

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesRole = !selectedRole.value || user.roles.includes(selectedRole.value);
    const matchesSearch = user.username?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesRole && matchesSearch;
  });
});

onMounted(() => {
  fetchUsers();
  fetchRoles();
});
</script>

<template>
  <h1 v-if="authStore.currentRole!='administrators'">Jūsu lomai nav piekļuves šai lapai.</h1>
  <div v-if="authStore.currentRole=='administrators'" class="p-4">
    <h1 class="text-xl font-bold mb-4">Lietotāju pārvaldība</h1>
    
    <div class="mb-4">
        <input  
          type="text" 
          v-model="searchQuery" 
          placeholder="Meklēt" 
          class="border p-2 w-full"
        />
        <label for="role-filter" class="mr-2">Filtrēt pēc lomas:</label>
        <select id="role-filter" v-model="selectedRole" class="border p-2">
          <option value="">Visi</option>
          <option v-for="role in roles" :key="role.role_id" :value="role.name">
            {{ role.name }}
          </option>
        </select>
        <button @click="openCreateModal" class="bg-green-500 text-white px-3 py-1 rounded">Izveidot lietotāju</button>
    </div>
    
    <table class="w-full border-collapse border border-gray-300">
        <thead>
            <tr class="bg-gray-100">
                <th class="border p-2">E-pasts</th>
                <th class="border p-2">Lietotājvārds</th>
                <th class="border p-2">Telefona nr.</th>
                <th class="border p-2">Lietotāja tips</th>
                <th class="border p-2">Lomas</th>
                <th class="border p-2">Aktīvs</th>
                <th  class="border p-2">Darbība</th>
            </tr>
        </thead>
        <tbody>
        <tr v-for="user in filteredUsers" :key="user.user_id" class="border" :class="{'bg-gray-200': !user.is_active}">
            <td class="border p-2">{{ user.email }}</td>
            <td class="border p-2">{{ user.username || '-' }}</td>
            <td class="border p-2">{{ user.phone_number || '-' }}</td>
            <td class="border p-2">{{ user.user_type }}</td>
            <td class="border p-2">
                <div class="flex gap-2">
                    <label v-for="role in roles" :key="role.role_id" class="flex items-center gap-1">
                        <input type="checkbox" :checked="user.roles.includes(role.name)" disabled />
                        {{ role.name }}
                    </label>
                </div>
            </td>
            <td class="border p-2">{{ user.is_active ? 'Jā' : 'Nē' }}</td>
            <td class="border p-2">
                <button @click="openEditModal(user)" class="bg-blue-500 text-white px-3 py-1 rounded">Rediģēt</button>
            </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Edit Modal -->
  <div v-if="showEditModal" class="modal-container">
    <div class="modal-content">
      <h2 class="text-lg font-bold mb-4">Rediģēt lietotāju</h2>
      <p><strong>E-pasts:</strong> {{ selectedUser?.email }}</p>
      <p><strong>Lietotājvārds:</strong> {{ selectedUser?.username || '-' }}</p>
      <p><strong>Lietotāja tips:</strong> {{ selectedUser?.user_type }}</p>
      <input v-model="selectedUser.phone_number" placeholder="Telefona numurs" class="border p-2 w-full mb-2" />
      <td class="border p-2">
        <label v-for="role in roles" :key="role.role_id" class="flex items-center gap-1">
          <input 
            type="checkbox" 
            class="toggle-switch"
            :checked="selectedUserRoles.includes(role.name)" 
            @change="toggleRole(role.name)" 
          />
          {{ role.name }}
        </label>
      </td>
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="selectedUser.is_active" /> Aktīvs
      </label>
      <div class="flex justify-end gap-2 mt-4">
        <button @click="closeEditModal" class="bg-gray-400 text-white px-4 py-2 rounded">Atcelt</button>
        <button @click="saveUserRoles(selectedUser)" class="bg-green-500 text-white px-4 py-2 rounded">Saglabāt</button>
      </div>
    </div>
  </div>

  <!-- Create User Modal -->
  <div v-if="showCreateModal" class="modal-container">
    <div class="modal-content">
      <h2 class="text-lg font-bold mb-4">Izveidot lietotāju</h2>
      <input v-model="newUser.email" placeholder="E-pasts" class="border p-2 w-full mb-2" />
      <input v-model="newUser.phone_number" placeholder="Telefona numurs" class="border p-2 w-full mb-2" />
      <select v-model="newUser.user_type" class="border p-2 w-full mb-2">
        <option value="Google">Google</option>
        <option value="Local">Local</option>
      </select>
      <input v-if="newUser.user_type === 'Local'" v-model="newUser.username" placeholder="Lietotājvārds" class="border p-2 w-full mb-2" />
      <input v-if="newUser.user_type === 'Local'" v-model="newUser.password" placeholder="Parole" type="password" class="border p-2 w-full mb-2" />
      <div class="mb-2">
        <label v-for="role in roles" :key="role.role_id" class="flex items-center gap-2">
          <input type="checkbox" @change="() => toggleNewUserRole(role.name, newUser)" /> {{ role.name }}
        </label>
      </div>
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="newUser.is_active" /> Aktīvs
      </label>
      <div class="flex justify-end gap-2">
        <button @click="closeCreateModal" class="bg-gray-400 text-white px-4 py-2 rounded">Atcelt</button>
        <button @click="saveNewUser" class="bg-green-500 text-white px-4 py-2 rounded">Saglabāt</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
html, body {
  overflow: visible !important;
}

.bg-gray-200 {
  background-color: #e0e0e0;
}

.fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f4f4f4;
}
tr:hover {
  background-color: #f0f0f0;
  transition: background-color 0.2s ease-in-out;
}
button {
  background: #4caf50;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.2);
  width: 400px;
}

.toggle-switch {
  appearance: none;
  width: 40px;
  height: 20px;
  background: #ccc;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  outline: none;
  transition: background 0.3s;
}

.toggle-switch:checked {
  background: #4CAF50;
}

.toggle-switch::before {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  top: 1px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle-switch:checked::before {
  transform: translateX(20px);
}
</style>
