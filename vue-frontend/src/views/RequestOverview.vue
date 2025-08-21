<script setup>
import { ref, onMounted, computed } from "vue";
import MultiComputerCalendar from "../components/MultiComputerCalendar.vue";
import api from "../services/api";
import { useAuthStore } from "../store/auth";

const authStore = useAuthStore();

const requests = ref([]);
const statuses = ["all", "pending", "approved", "denied"];
const selectedStatus = ref("pending");
const isModalOpen = ref(false);
const selectedRequest = ref(null);
const reservations = ref([]);
const allReservations = ref([]);
const selectedReservationDate = ref(null);

const isReportModalOpen = ref(false);
const reportStartDate = ref(null);
const reportEndDate = ref(null);

const reportReservations = ref([]);

const fetchRequests = async () => {
    try {
        const response = await api.get(`/requests`);
        requests.value = response.data;
    } catch (error) {
        console.error("Failed to fetch requests:", error);
    }
};

const fetchReservations = async (requestId) => {
    try {
        const response = await api.get(`/reservations/request/${requestId}`);
        reservations.value = response.data;
    } catch (error) {
        console.error("Failed to fetch reservations:", error);
    }
}
const fetchAllReservations = async () => {
    try {
        const response = await api.get(`/reservations`);
        allReservations.value = response.data;
        console.log("allReservations:", allReservations.value); // 👈 te redzēsi laukus
    } catch (error) {
        console.error("Failed to fetch all reservations:", error);
    }
}

const fetchReportReservations = async (startDate, endDate) => {
    try {
        const response = await api.get('/report-reservations', {
            params: {
                start: startDate,
                end: endDate
            }
        });
        reportReservations.value = response.data;
    } catch (error) {
        console.error("Failed to fetch report reservations:", error);
    }
};

const openModal = async (request) => {
    selectedRequest.value = { ...request };
    await fetchReservations(request.request_id);
    selectedReservationDate.value = reservationDates.value[0] || null;
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    selectedRequest.value = null;
    reservations.value = [];
};

const updateStatus = async () => {
    try {
        await api.put(`/requests/${selectedRequest.value.request_id}`, {
            information: selectedRequest.value.information,
            status: selectedRequest.value.status
        });

        const index = requests.value.findIndex(r => r.request_id === selectedRequest.value.request_id);
        if (index !== -1) {
            requests.value[index] = { ...selectedRequest.value };
        }

        alert("Status veiksmīgi nomainīts!");
        closeModal();
    } catch (error) {
        console.error("Failed to update status:", error);
        alert("Neizdevās nomainīt statusu.");
    }
};

const uniqueTimeRanges = computed(() => { // prevents duplicate times
    const times = new Set();

    reservations.value.forEach(reservation => {
        const timeRange = `${new Date(reservation.from_time).toLocaleString()} - ${new Date(reservation.to_time).toLocaleString()}`;
        times.add(timeRange);
    });

    return [...times];
});

const uniqueComputers = computed(() => { // prevents duplicate computers
    const computers = new Set();

    reservations.value.forEach(reservation => {
        computers.add(reservation.computer_name);
    });

    return [...computers];
});

const filteredRequests = computed(() => {
    if (selectedStatus.value === "all") {
        return requests.value;
    }
    return requests.value.filter(request => request.status === selectedStatus.value);
});

const selectedComputers = computed(() => {
    const map = new Map();
    reservations.value.forEach(r => {
        map.set(r.computer_id, {
            computer_id: r.computer_id,
            computer_name: r.computer_name
        });
    });
    return Array.from(map.values());
});

const reservationDates = computed(() => {
    const dateSet = new Set();
    reservations.value.forEach(r => {
        const from = new Date(r.from_time);
        const to = new Date(r.to_time);
        let current = new Date(from);
        while (current <= to) {
            const dateStr = current.toLocaleDateString('sv-SE'); //swedish time for unambigious date format
            dateSet.add(dateStr);
            current.setDate(current.getDate() + 1);
        }
    });
    return Array.from(dateSet).sort();
});

const openReportModal = () => {
    isReportModalOpen.value = true;
    reportStartDate.value = null;
    reportEndDate.value = null;
};

const closeReportModal = () => {
    isReportModalOpen.value = false;
};

const generateReport = async () => {
    const start = new Date(reportStartDate.value);
    const end = new Date(reportEndDate.value);
    if (!start || !end || start > end) {
        alert("Lūdzu, ievadiet pareizu datumu intervālu.");
        return;
    }

    await fetchReportReservations(start, end);

    const dates = [];
    const current = new Date(start);
    while (current <= end) {
        dates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
    }

    const computerMap = new Map();
    for (const r of reportReservations.value) {
        if (!computerMap.has(r.computer_id)) {
            computerMap.set(r.computer_id, r.computer_name);
        }
    }

    const computerIds = Array.from(computerMap.keys());
    const rows = [];
    for (const dateStr of dates) {
        const dayStart = new Date(`${dateStr}T00:00:00`);
        const dayEnd = new Date(`${dateStr}T23:59:59`);
        const workStart = new Date(`${dateStr}T08:00:00`);
        const workEnd = new Date(`${dateStr}T18:00:00`);

        const computerHours = {};

        for (const id of computerIds) {
            computerHours[id] = { total: 0, work: 0 };
        }

        const intervalsForOverlap = [];

        for (const r of reportReservations.value) {
            const resStart = new Date(r.from_time);
            const resEnd = new Date(r.to_time);
            if (resEnd < dayStart || resStart > dayEnd) continue;

            const overlapStart = resStart > dayStart ? resStart : dayStart;
            const overlapEnd = resEnd < dayEnd ? resEnd : dayEnd;
            const hoursTotal = (overlapEnd - overlapStart) / 1000 / 60 / 60;

            if (hoursTotal > 0) {
                computerHours[r.computer_id].total += hoursTotal;

                const workOverlapStart = overlapStart > workStart ? overlapStart : workStart;
                const workOverlapEnd = overlapEnd < workEnd ? overlapEnd : workEnd;

                const workHours = (workOverlapEnd - workOverlapStart) / 1000 / 60 / 60;
                if (workHours > 0) {
                    computerHours[r.computer_id].work += workHours;
                }

                intervalsForOverlap.push([overlapStart, overlapEnd]);
            }
        }

        // calculate nonoverlapping hours
        intervalsForOverlap.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const interval of intervalsForOverlap) {
            if (!merged.length || interval[0] > merged[merged.length - 1][1]) {
                merged.push(interval);
            } else {
                merged[merged.length - 1][1] = new Date(Math.max(
                    merged[merged.length - 1][1], interval[1]
                ));
            }
        }

        const overlapTotal = merged.reduce((sum, [start, end]) => sum + (end - start) / 1000 / 60 / 60, 0);

        const row = [dateStr];
        for (const id of computerIds) {
            const comp = computerHours[id];
            row.push(comp.total.toFixed(2), comp.work.toFixed(2));
        }
        row.push(overlapTotal.toFixed(2));
        rows.push(row);
    }

    // Build header
    const header = ["Datums"];
    for (const id of computerIds) {
        const name = computerMap.get(id);
        header.push(`${name} 24h`, `${name} 8-18h`);
    }
    header.push("kopējā noslogotība");

    const lines = [header.join("\t"), ...rows.map(r => r.join("\t"))];
    const blob = new Blob([lines.join("\n")], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `noslogotibas-parskats_${reportStartDate.value}_-_${reportEndDate.value}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
};

onMounted(() => {
    fetchRequests();
    fetchAllReservations();
});

// function conputerCount(computers){
//     let count = 0;
//     for(computer in uniqueComputers){
//         count++;
//     }
//     return count;
// }
// Atgriež rezervācijas konkrētam pieprasījumam
function getReservationsForRequest(requestId) {
    return allReservations.value.filter(r => String(r.request_id) === String(requestId));
}
function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d)) return d;
  // fallback uz regex (ja kāds AM/PM string)
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}), (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)/);
  if (!match) return null;
  let [, month, day, year, hour, minute, second, ampm] = match;
  month = parseInt(month, 10) - 1;
  day = parseInt(day, 10);
  year = parseInt(year, 10);
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10);
  second = parseInt(second, 10);
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return new Date(year, month, day, hour, minute, second);
}
// Atgriež unikālos laika intervālus konkrētam pieprasījumam
function getTimeIntervals(requestId) {
    const reservations = getReservationsForRequest(requestId);
    const times = new Set();
    reservations.forEach(res => {
        const from = parseDate(res.start || res.from_time);
        const to = parseDate(res.end || res.to_time);
        if (from && to) {
            times.add(`${from.toLocaleString()} - ${to.toLocaleString()}`);
        }
    });
    return Array.from(times);
}

// Atgriež unikālo datoru skaitu konkrētam pieprasījumam
function getComputerCount(requestId) {
    const reservations = getReservationsForRequest(requestId);
    const computers = new Set();
    reservations.forEach(res => {
        computers.add(res.computer_name || res.name);
    });
    return computers.size;
}
function hasOverlap(request) {
  const requestReservations = getReservationsForRequest(request.request_id);
  const result = allReservations.value.some(r =>
    String(r.request_id) !== String(request.request_id) &&
    r.status !== "denied" &&
    requestReservations.some(rr => {
      const rrFrom = parseDate(rr.start || rr.from_time);
      const rrTo = parseDate(rr.end || rr.to_time);
      const rFrom = parseDate(r.start || r.from_time);
      const rTo = parseDate(r.end || r.to_time);
      const sameComputer = rr.computer_id === r.computer_id;
      const overlap = rrFrom < rTo && rrTo > rFrom;
      if (sameComputer && overlap) {
        console.log("Rezervāciju pārklājums starp:", rr, r);
      }
      return sameComputer && overlap;
    })
  );
  console.log("hasOverlap:", request.request_id, result);
  return result;
}
function hasRequestOverlap(request) {
  console.log("request", request.request_id, "reservations:", getReservationsForRequest(request.request_id));
  requests.value.forEach(r => {
    console.log("other request", r.request_id, "reservations:", getReservationsForRequest(r.request_id));
  });

  const requestReservations = getReservationsForRequest(request.request_id);
  const result = requests.value.some(r =>
    r.request_id !== request.request_id &&
    r.status !== "denied" &&
    getReservationsForRequest(r.request_id).some(rr =>
      requestReservations.some(res => {
        const sameComputer = rr.computer_id === res.computer_id;
        const overlap = parseDate(res.start || res.from_time) < parseDate(rr.end || rr.to_time) &&
                        parseDate(res.end || res.to_time) > parseDate(rr.start || rr.from_time);
        if (sameComputer && overlap) {
          console.log("Pieprasījumu pārklājums starp:", res, rr);
        }
        return sameComputer && overlap;
      })
    )
  );
  console.log("hasRequestOverlap:", request.request_id, result);
  return result;
}
function getWarnings(request) {
  const warnings = [];

  // PIEPRASĪJUMU pārklājums → balstās uz rezervācijām
  const requestReservations = getReservationsForRequest(request.request_id);
  const hasRequestOverlap = requests.value.some(r => {
    if (r.request_id === request.request_id || r.status === "denied") return false;
    const otherReservations = getReservationsForRequest(r.request_id);
    return requestReservations.some(rr =>
      otherReservations.some(or =>
        parseDate(rr.from_time) < parseDate(or.to_time) &&
        parseDate(rr.to_time) > parseDate(or.from_time)
      )
    );
  });
  if (hasRequestOverlap) warnings.push("request");

  // REZERVĀCIJU pārklājums → ar datoru ID
  const hasReservationOverlap = allReservations.value.some(res =>
    String(res.request_id) !== String(request.request_id) &&
    res.status !== "denied" &&
    requestReservations.some(rr =>
      rr.computer_id === res.computer_id &&
      parseDate(rr.from_time) < parseDate(res.to_time) &&
      parseDate(rr.to_time) > parseDate(res.from_time)
    )
  );
  if (hasReservationOverlap) warnings.push("reservation");

  return warnings;
}
</script>

<template>
    <h1 v-if="authStore.currentRole!='pārvaldnieks' && authStore.currentRole!='laborants'">Jūsu lomai nav piekļuves šai lapai.</h1>
    <div v-if="authStore.currentRole=='pārvaldnieks' || authStore.currentRole=='laborants'" class="request-container">
        <h1>Rezervāciju veidošana</h1>
        <h4 v-if="authStore.currentRole=='laborants'">Ģenerēt noslogotības pārskatu var tikai pārvaldnieki.</h4>
        <button v-if="authStore.currentRole=='pārvaldnieks'" @click="openReportModal">Ģenerēt noslogotības pārskatu</button>

        <div class="filter-container">
            <label for="statusFilter">Filtrēt pēc statusa:</label>
            <select id="statusFilter" v-model="selectedStatus">
                <option v-for="status in statuses" :key="status" :value="status">
                    {{ status }}
                </option>
            </select>
        </div>
        <h4 v-if="authStore.currentRole=='pārvaldnieks'">Mainīt pieprasījumu statusu var tikai laboranti.</h4>
        <table>
            <thead>
                <tr>
                    <th>Lietotāja e-pasts</th>
                    <th>Informācija</th>
                    <th>Laika intervāli</th>
                    <!-- <th>Datoru skaits</th> -->
                    <th>Izveidots</th>
                    <th>Statuss</th>
                    <th>Brīdinājums</th>
                    <th v-if="authStore.currentRole=='laborants'">Darbība</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="request in filteredRequests" :key="request.request_id">
                    <td>{{ request.email }}</td>
                    <td>{{ request.information }}</td>
                    <td>
                        <ul>
                            <li v-for="interval in getTimeIntervals(request.request_id)" :key="interval">{{ interval }}</li>
                        </ul>
                    </td>
                    <td>{{ getComputerCount(request.request_id) }}</td>
                    <td>{{ new Date(request.created_at).toLocaleString() }}</td>
                    <td>
                        {{ request.status }}
                    </td>
                    <td>
                       <span v-if="hasRequestOverlap(request)" class="warning-badge">
                         Pieprasījumu pārklājums!
                    </span>
                    <span v-if="hasOverlap(request)" class="danger-badge">
                         Rezervāciju pārklājums!
                    </span>
                    </td>
                    <td v-if="authStore.currentRole=='laborants'">
                        <button  @click="openModal(request)">Rediģēt</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div v-if="isModalOpen" class="modal">
        <div class="modal-content horizontal">
            <div class="modal-left">
                <h2>Rediģēt rezervāciju</h2>
                <p><strong>E-pasts:</strong> {{ selectedRequest.email }}</p>
                <p><strong>Izveidots:</strong> {{ new Date(selectedRequest.created_at).toLocaleString() }}</p>
                <p><strong>Informācija:</strong> {{ selectedRequest.information }}</p>
                <p><strong>Rezervācijas laiki:</strong></p>
                <ul>
                    <li v-for="time in uniqueTimeRanges" :key="time">{{ time }}</li>
                </ul>
                <p><strong>Izvēlētie datori:</strong></p>
                <ul>
                    <li v-for="computer in uniqueComputers" :key="computer">{{ computer }}</li>
                </ul>

                <label for="status">Statuss:</label>
                <select id="status" v-model="selectedRequest.status">
                    <option v-for="status in statuses.slice(1)" :key="status" :value="status">
                        {{ status }}
                    </option>
                </select>
                <div class="modal-actions">
                    <button @click="updateStatus">Saglabāt</button>
                    <button @click="closeModal">Aizvērt</button>
                </div>
            </div>
            <div class="modal-right">
                <label for="reservation-date">Izvēlies datumu: </label>
                <select id="reservation-date" v-model="selectedReservationDate">
                    <option v-for="date in reservationDates" :key="date" :value="date">
                        {{ new Date(date).toLocaleDateString("lv-LV", {
                            year: 'numeric', month: 'long', day: 'numeric'
                        }) }}
                    </option>
                </select>
                <MultiComputerCalendar :computers="selectedComputers" :reservations="allReservations"
                    :selectedRequest="selectedRequest" :initialDate="selectedReservationDate" />
            </div>
        </div>
    </div>

    <div v-if="isReportModalOpen" class="modal">
        <div class="modal-content">
            <h2>Ģenerēt noslogotības pārskatu</h2>
            <label>Sākuma datums:</label>
            <input type="date" v-model="reportStartDate">
            <label>Beigu datums:</label>
            <input type="date" v-model="reportEndDate">

            <div class="modal-actions">
                <button @click="generateReport">Ģenerēt un lejupielādēt</button>
                <button @click="closeReportModal">Aizvērt</button>
            </div>
        </div>
    </div>

</template>

<style scoped>
.warning-badge {
  background: #a59252ff;
  color: #f0ec21ff;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 4px;
  font-weight: bold;
  border: 1px solid #ffeeba;
}

.danger-badge {
  background: #f8d7da;
  color: #cc0d20ff;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 4px;
  font-weight: bold;
  border: 1px solid #f5c6cb;
}
.request-container {
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
    background: #4caf50;
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
    min-width: 300px;
}

.modal-content.horizontal {
    display: flex;
    gap: 20px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
}

.modal-left {
    flex: 1;
    min-width: 300px;
}

.modal-right {
    flex: 2;
    min-width: 400px;
    max-height: 80vh;
    overflow: auto;
}

.modal-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
}
</style>
