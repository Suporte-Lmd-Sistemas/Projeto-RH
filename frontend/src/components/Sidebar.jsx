import React from "react";

export default function Sidebar() {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>LMD Sistemas</div>

      <nav style={styles.menu}>
        <MenuItem label="Dashboard" />
        <MenuItem label="Inbox" />
        <MenuItem label="Calendario" />
        <MenuItem label="Funcionarios" active />
        <MenuItem label="Performance" />
        <MenuItem label="Pagamentos" />
        <MenuItem label="Cargos e Departamentos" />
        <MenuItem label="Recrutamento" />
      </nav>
    </div>
  );
}

function MenuItem({ label, active }) {
  return (
    <div
      style={{
        ...styles.menuItem,
        ...(active ? styles.menuItemActive : {})
      }}
    >
      {label}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    height: "100vh",
    background: "#f7f8fa",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    padding: "20px"
  },

  logo: {
    fontWeight: "bold",
    fontSize: "18px",
    marginBottom: "30px"
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  menuItem: {
    padding: "10px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#333"
  },

  menuItemActive: {
    background: "#3b82f6",
    color: "#fff"
  }
};