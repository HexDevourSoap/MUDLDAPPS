<script setup>
import { ref, onMounted } from "vue";
import api from "../services/api";
import { useAuthStore } from "./../store/auth";

const computers = ref([]);
const showModal = ref(false);
const showEditModal = ref(false);
const authStore = useAuthStore();

const newComputer = ref({
  name: "",
  description: "",
  row: "",
  column: "",
});

const editedComputer = ref({
  computer_id: null,
  name: "",
  description: "",
  row: "",
  column: "",
});

const fetchComputers = async () => {
  try {
    const response = await api.get("/computers");
    computers.value = response.data.computers;
  } catch (error) {
    console.error("Failed to fetch computers:", error);
  }
};

const addComputer = async () => {
  try {
    await api.post("/computers", newComputer.value);
    showModal.value = false;
    fetchComputers();
    newComputer.value = { name: "", description: "", row: "", column: "" };
  } catch (error) {
    console.error("Failed to add computer:", error);
  }
};

const deleteComputer = async (computerId) => {
  try {
    await api.delete(`/computers/${computerId}`);
    computers.value = computers.value.filter(c => c.computer_id !== computerId);
    alert("Dators veiksmīgi izdzēsts!");
  } catch (error) {
    console.error("Error deleting computer:", error);
    alert("Kļūda dzēšot datoru!");
  }
};

const confirmDelete = (computerId) => {
  if (confirm("Vai tiešām vēlies dzēst šo datoru?")) {
    deleteComputer(computerId);
  }
};


const editComputer = (computer) => {
  editedComputer.value = {
    computer_id: computer.computer_id,
    name: computer.computer_name,
    description: computer.description || "",
    row: computer.comp_row,
    column: computer.comp_col
  };
  showEditModal.value = true;
};

const updateComputer = async () => {
  try {
    await api.put(`/computers/${editedComputer.value.computer_id}`, editedComputer.value);
    showEditModal.value = false;
    fetchComputers();
  } catch (error) {
    console.error("Failed to update computer:", error);
  }
};

const showComponentModal = ref(false);
const components = ref([]);
const newComponent = ref({
  name: "",
  category: "",
  description: "",
});

const fetchComponents = async () => {
  try {
    const response = await api.get("/components");
    components.value = response.data.components;
  } catch (error) {
    console.error("Failed to load components:", error);
  }
};

const addComponent = async () => {
  try {
    await api.post("/components", newComponent.value);
    await fetchComponents();
    newComponent.value = { name: "", category: "", description: "" };
  } catch (error) {
    console.error("Failed to add component:", error);
  }
};

const saveComponent = async (component) => {
  if (!confirm("Vai tiešām vēlies rediģēt šo komponenti?")) return;
  try {
    await api.put(`/components/${component.component_id}`, {
      name: component.component_name,
      category: component.category,
      description: component.description
    });
    fetchComponents();
    alert("Komponente veiksmīgi pārveidota.");
  } catch (error) {
    console.error("Failed to update component:", error);
    alert("Neizdevās atjaunināt komponenti.");
  }
};

const deleteComponent = async (componentId) => {
  if (!confirm("Vai tiešām vēlies dzēst šo komponenti?")) return;

  try {
    await api.delete(`/components/${componentId}`);
    fetchComponents();
    alert("Komponente veiksmīgi izdzēsta.");
  } catch (error) {
    console.error("Failed to delete component:", error);
    alert("Neizdevās dzēst komponenti. Tā iespējams tiek izmantota.");
  }
};

const showOSModal = ref(false);
const osList = ref([]);
const newOS = ref({
  name: "",
  version: ""
});

const fetchOS = async () => {
  try {
    const response = await api.get("/os");
    osList.value = response.data.os;
  } catch (error) {
    console.error("Failed to load OS list:", error);
  }
};

const addOS = async () => {
  try {
    await api.post("/os", newOS.value);
    await fetchOS();
    newOS.value = { name: "", version: "" };
  } catch (error) {
    console.error("Failed to add OS:", error);
  }
};

const saveOS = async (os) => {
  if (!confirm("Vai tiešām vēlies rediģēt šo OS?")) return;
  try {
    await api.put(`/os/${os.os_id}`, {
      name: os.os_name,
      version: os.version
    });
    fetchOS();
    alert("OS veiksmīgi pārveidota.");
  } catch (error) {
    console.error("Failed to update OS:", error);
    alert("Neizdevās atjaunināt OS.");
  }
};

const deleteOS = async (osId) => {
  if (!confirm("Vai tiešām vēlies dzēst šo OS?")) return;

  try {
    await api.delete(`/os/${osId}`);
    fetchOS();
    alert("OS veiksmīgi izdzēsta.");
  } catch (error) {
    console.error("Failed to delete OS:", error);
    alert("Neizdevās dzēst OS. Tā iespējams tiek izmantota.");
  }
};

const showSoftwareModal = ref(false);
const softwareList = ref([]);
const newSoftware = ref({
  name: "",
  version: ""
});

const fetchSoftware = async () => {
  try {
    const response = await api.get("/software");
    softwareList.value = response.data.software;
  } catch (error) {
    console.error("Failed to load software list:", error);
  }
};

const addSoftware = async () => {
  try {
    await api.post("/software", newSoftware.value);
    await fetchSoftware();
    newSoftware.value = { name: "", version: "" };
  } catch (error) {
    console.error("Failed to add software:", error);
  }
};

const saveSoftware = async (software) => {
  if (!confirm("Vai tiešām vēlies rediģēt šo programmatūru?")) return;
  try {
    await api.put(`/software/${software.software_id}`, {
      name: software.software_name,
      version: software.version
    });
    fetchSoftware();
    alert("Programmatūra veiksmīgi pārveidota.");
  } catch (error) {
    console.error("Failed to update software:", error);
    alert("Neizdevās atjaunināt programmatūru.");
  }
};

const deleteSoftware = async (softwareId) => {
  if (!confirm("Vai tiešām vēlies dzēst šo programmatūru?")) return;

  try {
    await api.delete(`/software/${softwareId}`);
    fetchSoftware();
    alert("Programmatūra veiksmīgi izdzēsta.");
  } catch (error) {
    console.error("Failed to delete software:", error);
    alert("Neizdevās dzēst programmatūru. Tā iespējams tiek izmantota.");
  }
};

onMounted(fetchComputers);
</script>

<template>

  <div class="computers-container">
    <h1>Datoru pārskats</h1>

    <button v-if="authStore.currentRole=='administrators'" @click="showModal = true" class="add-button">Pievienot datoru</button>
    <button v-if="authStore.currentRole=='administrators'" @click="() => { showComponentModal = true; fetchComponents(); }" class="add-button">
      Komponentes
    </button>
    <button v-if="authStore.currentRole=='administrators'" @click="() => { showOSModal = true; fetchOS(); }" class="add-button">
      Operētājsistēmas
    </button>
    <button v-if="authStore.currentRole=='administrators'" @click="() => { showSoftwareModal = true; fetchSoftware(); }" class="add-button">
      Programmatūra
    </button>
    <div class="computer-cards">
      <div v-for="computer in computers" :key="computer.computer_id" class="computer-card">
        <h2>{{ computer.computer_name }}</h2>
        <p><strong>Komponentes:</strong> {{ computer.components.join(', ') }}</p>
        <div v-for="os in computer.os_details" :key="os.os_name">
          <p><strong>OS:</strong> {{ os.os_name }} ({{ os.os_version }})</p>
          <p><strong>Programmatūra:</strong>
            {{ os.software.length > 0 ? os.software.join(', ') : "Nav instalēta" }}
          </p>
        </div>
        <button v-if="authStore.currentRole=='administrators'" @click="editComputer(computer)" class="edit-btn">Rediģēt</button>
        <button v-if="authStore.currentRole=='administrators'" @click="confirmDelete(computer.computer_id)" class="delete-btn">Dzēst</button>
      </div>
    </div>

    <!-- add computer modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h2>Pievienot jaunu datoru</h2>
        <label>Nosaukums:</label>
        <input v-model="newComputer.name" type="text" required />

        <label>Apraksts:</label>
        <input v-model="newComputer.description" type="text" />

        <label>Rinda:</label>
        <input v-model="newComputer.row" type="number" required />

        <label>Kolonna:</label>
        <input v-model="newComputer.column" type="number" required />

        <button @click="addComputer">Pievienot</button>
        <button @click="showModal = false" class="close-button">Aizvērt</button>
      </div>
    </div>

    <!-- edit computer modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal">
        <h2>Rediģēt datoru</h2>
        <label>Nosaukums:</label>
        <input v-model="editedComputer.name" type="text" required />

        <label>Apraksts:</label>
        <input v-model="editedComputer.description" type="text" />

        <label>Rinda:</label>
        <input v-model="editedComputer.row" type="number" required />

        <label>Kolonna:</label>
        <input v-model="editedComputer.column" type="number" required />

        <button @click="updateComputer">Saglabāt</button>
        <button @click="showEditModal = false" class="close-button">Aizvērt</button>
      </div>
    </div>

    <!-- Component Modal -->
    <div v-if="showComponentModal" class="modal-overlay">
      <div class="modal" style="min-width: 600px;">
        <h2>Komponentes</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Nosaukums</th>
              <th>Kategorija</th>
              <th>Apraksts</th>
              <th>Darbības</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="component in components" :key="component.component_id">
              <td><input v-model="component.component_name" /></td>
              <td><input v-model="component.category" /></td>
              <td><input v-model="component.description" /></td>
              <td>
                <button @click="saveComponent(component)">Saglabāt</button>
                <button @click="deleteComponent(component.component_id)">Dzēst</button>
              </td>
            </tr>

            <!-- add new component -->
            <tr>
              <td><input v-model="newComponent.name" placeholder="Nosaukums" /></td>
              <td><input v-model="newComponent.category" placeholder="Kategorija" /></td>
              <td><input v-model="newComponent.description" placeholder="Apraksts" /></td>
              <td><button @click="addComponent">Pievienot</button></td>
            </tr>
          </tbody>
        </table>

        <button @click="showComponentModal = false" class="close-button">Aizvērt</button>
      </div>
    </div>

    <!-- OS Modal -->
    <div v-if="showOSModal" class="modal-overlay">
      <div class="modal" style="min-width: 600px;">
        <h2>Operētājsistēmas</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Nosaukums</th>
              <th>Versija</th>
              <th>Darbības</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="os in osList" :key="os.os_id">
              <td><input v-model="os.os_name" /></td>
              <td><input v-model="os.version" /></td>
              <td>
                <button @click="saveOS(os)">Saglabāt</button>
                <button @click="deleteOS(os.os_id)">Dzēst</button>
              </td>
            </tr>

            <!-- Add new OS -->
            <tr>
              <td><input v-model="newOS.name" placeholder="Nosaukums" /></td>
              <td><input v-model="newOS.version" placeholder="Versija" /></td>
              <td><button @click="addOS">Pievienot</button></td>
            </tr>
          </tbody>
        </table>

        <button @click="showOSModal = false" class="close-button">Aizvērt</button>
      </div>
    </div>

    <!-- Software Modal -->
    <div v-if="showSoftwareModal" class="modal-overlay">
      <div class="modal" style="min-width: 600px;">
        <h2>Programmatūra</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Nosaukums</th>
              <th>Versija</th>
              <th>Darbības</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="software in softwareList" :key="software.software_id">
              <td><input v-model="software.software_name" /></td>
              <td><input v-model="software.version" /></td>
              <td>
                <button @click="saveSoftware(software)">Saglabāt</button>
                <button @click="deleteSoftware(software.software_id)">Dzēst</button>
              </td>
            </tr>

            <!-- Add new software -->
            <tr>
              <td><input v-model="newSoftware.name" placeholder="Nosaukums" /></td>
              <td><input v-model="newSoftware.version" placeholder="Versija" /></td>
              <td><button @click="addSoftware">Pievienot</button></td>
            </tr>
          </tbody>
        </table>

        <button @click="showSoftwareModal = false" class="close-button">Aizvērt</button>
      </div>
    </div>

  </div>



</template>

<style scoped>
.computers-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.add-button {
  padding: 10px 15px;
  margin-bottom: 10px;
  background: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
}

.computer-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.computer-card {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
  background: white;
}

/* Modal window */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
}

input {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
}

.close-button,
.edit-btn,
.delete-btn {
  padding: 8px;
  margin: 5px;
  border: none;
  cursor: pointer;
}

.edit-btn {
  background: #008cba;
  color: white;
}

.delete-btn {
  background: red;
  color: white;
}

.delete-btn:hover {
  background: darkred;
}

.edit-btn:hover {
  background: #005f7a;
}

table,
th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #f4f4f4;
}
</style>
