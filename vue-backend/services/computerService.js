const pool = require("../db");

async function getComputers() {
  const [computers] = await pool.query(`
    SELECT computer_id, name AS computer_name, description, comp_row, comp_col
    FROM computers;
  `);

  for (const computer of computers) {
    const osList = await getComputerOS(computer.computer_id);
    const components = await getComputerComponents(computer.computer_id);

    computer.os_details = [];
    for (const os of osList) {
      const software = await getComputerOsSoftware(os.computer_os_id);
      computer.os_details.push({
        os_name: os.os_name,
        os_version: os.os_version,
        software: software.length > 0 ? software : ["Nav instalēta"]
      });
    }

    computer.components = components.length > 0 ? components : ["Nav pieejamas"];
  }

  return computers;
}

async function getComputerOS(computerId) {
  const [rows] = await pool.query(`
    SELECT co.computer_os_id, os.name AS os_name, os.version AS os_version
    FROM computer_os co
    LEFT JOIN os ON co.os_id = os.os_id
    WHERE co.computer_id = ?;
  `, [computerId]);
  return rows;
}

async function getComputerComponents(computerId) {
  const [rows] = await pool.query(`
    SELECT comp.name
    FROM computer_components cc
    LEFT JOIN components comp ON cc.component_id = comp.component_id
    WHERE cc.computer_id = ?;
  `, [computerId]);
  return rows.map(row => row.name);
}

async function getComputerOsSoftware(computerOsId) {
  const [rows] = await pool.query(`
    SELECT s.name
    FROM computer_os_software cos
    LEFT JOIN software s ON cos.software_id = s.software_id
    WHERE cos.computer_os_id = ?;
  `, [computerOsId]);
  return rows.map(row => row.name);
}

async function addComputer({ name, description, row, column }) {
  const [result] = await pool.query(`
    INSERT INTO computers (name, description, comp_row, comp_col)
    VALUES (?, ?, ?, ?);
  `, [name, description, row, column]);
  return { computer_id: result.insertId, name, description, row, column };
}



async function deleteComputer(computerId) {
  try {
    await pool.query(`
      DELETE FROM computers WHERE computer_id = ?;
    `, [computerId]);
  } catch (error) {
    console.error("Error deleting computer:", error);
    throw error;
  }
}

async function updateComputer(computerId, { name, description, row, column }) {
  try {
    console.log("Updating computer:", { computerId, name, description, row, column });
    await pool.query(`
      UPDATE computers 
      SET name = ?, description = ?, 
      comp_row = ?, comp_col = ? 
      WHERE computer_id = ?;
    `, [name, description, row, column, computerId]);
  } catch (error) {
    console.error("Error updating computer:", error);
    throw error;
  }
}


async function getComponents() {
  const [rows] = await pool.query(`
    SELECT component_id, name as component_name, category, description
    FROM components ORDER BY component_name ASC;
  `);
  return rows;
}

async function addComponent({ name, category, description }) {
  const [result] = await pool.query(`
    INSERT INTO components (name, category, description)
    VALUES (?, ?, ?);
  `, [name, category, description]);
  return { component_id: result.insertId, name, category, description };
}

async function deleteComponent(componentId) {
  const [used] = await pool.query(`
    SELECT COUNT(*) as count FROM computer_components WHERE component_id = ?
  `, [componentId]);

  if (used[0].count > 0) {
    throw new Error("Component is in use and cannot be deleted.");
  }
  try {
    await pool.query(`
      DELETE FROM components WHERE component_id = ?;
    `, [componentId]);
  } catch (error) {
    console.error("Error deleting component:", error);
    throw error;
  }
}

async function updateComponent(componentId, { name, category, description }) {
  try {
    console.log("Updating component:", { componentId, name, category, description });
    await pool.query(`
      UPDATE components 
      SET name = ?, category = ?, description = ? 
      WHERE component_id = ?;
    `, [name, category, description, componentId]);
  } catch (error) {
    console.error("Error updating component:", error);
    throw error;
  }
}

async function getOS() {
  const [rows] = await pool.query(`
    SELECT os_id, name as os_name, version
    FROM os ORDER BY os_name ASC;
  `);
  return rows;
}

async function addOS({ name, version }) {
  const [result] = await pool.query(`
    INSERT INTO os (name, version)
    VALUES (?, ?);
  `, [name, version]);
  return { os_id: result.insertId, name, version };
}

async function deleteOS(osId) {
  const [used] = await pool.query(`
    SELECT COUNT(*) as count FROM computer_os WHERE os_id = ?
  `, [osId]);

  if (used[0].count > 0) {
    throw new Error("OS is in use and cannot be deleted.");
  }
  try {
    await pool.query(`
      DELETE FROM os WHERE os_id = ?;
    `, [osId]);
  } catch (error) {
    console.error("Error deleting OS:", error);
    throw error;
  }
}

async function updateOS(osId, { name, version }) {
  try {
    console.log("Updating OS:", { osId, name, version });
    await pool.query(`
      UPDATE os 
      SET name = ?, version = ? 
      WHERE os_id = ?;
    `, [name, version, osId]);
  } catch (error) {
    console.error("Error updating OS:", error);
    throw error;
  }
}

const getSoftware = async () => {
  const [rows] = await pool.query(`
    SELECT software_id, name as software_name, version
    FROM software ORDER BY software_name ASC;
    `);
  return rows;
};

const addSoftware = async ({ name, version }) => {
  const [result] = await pool.query(`
    INSERT INTO software (name, version) 
    VALUES (?, ?);
  `, [name, version]);
  return { software_id: result.insertId, name, version };
};

const updateSoftware = async (softwareId, { name, version }) => {
  try {
    console.log("Updating software:", { softwareId, name, version });
    await pool.query(`
      UPDATE software SET name = ?, version = ?
      WHERE software_id = ?;
    `, [name, version, softwareId]);
  } catch (error) {
    console.error("Error updating software:", error);
    throw error;
  }
};

const deleteSoftware = async (softwareId) => {
  const [used] = await pool.query(`
    SELECT COUNT(*) as count FROM computer_os_software WHERE software_id = ?
  `, [softwareId]);

  if (used[0].count > 0) {
    throw new Error("Software is in use and cannot be deleted.");
  }
  try {
    await pool.query(`
      DELETE FROM software WHERE software_id = ?;
    `, [softwareId]);
  } catch (error) {
    console.error("Error deleting OS:", error);
    throw error;
  }
};



async function getGPU() {
  const [rows] = await pool.query(
    `SELECT component_id, name as component_name, description,
    FROM components ORDER BY component_name ASC
    WHERE category='GPU';`
  )
  return rows;
}
async function getCPU(){
  const [rows] = await pool.query(
    `SELECT component_id, name as component_name, description,
    FROM components ORDER BY component_name ASC
    WHERE category='CPU';`
  )
  return rows;
}
async function getRAM(){
  const [rows] = await pool.query(`
    SELECT component_id, name as component_name, description,
    FROM components ORDER BY component_name ASC
    WHERE category='RAM';
  `)
  return rows;
}
async function getDrive(){
  const [rows] = await pool.query(`
    SELECT component_id, name as component_name, category, description,
    FROM components ORDER BY component_name ASC
    WHERE category='SSD' OR category='HDD';
  `)
}

async function getWindows(){
  const [rows] = await pool.query(`
    SELECT os_id, name as os_name, version
    FROM os ORDER BY os_name ASC
    WHERE LIKE os_name='Windows';
  `)
  return rows;
}
async function getLinux(){
  const [rows] = await pool.query(`
    SELECT os_id, name as os_name, version
    FROM os ORDER BY os_name ASC
    WHERE os_name='Debian' OR os_name='Ubuntu';
  `)
  return rows;
}

module.exports = {
  getComputers,
  addComputer,
  deleteComputer,
  updateComputer,

  getComponents,
  addComponent,
  deleteComponent,
  updateComponent,

  getOS,
  addOS,
  deleteOS,
  updateOS,

  getSoftware,
  addSoftware,
  updateSoftware,
  deleteSoftware,


  getGPU,
  getCPU,
  getRAM,
  getDrive,

  getWindows,
  getLinux
};