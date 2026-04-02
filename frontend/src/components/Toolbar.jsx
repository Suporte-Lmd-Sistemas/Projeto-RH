export default function Toolbar({ search, setSearch, onNovo }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.leftGroup}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Pesquisa"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />
        </div>

        <select style={styles.select} disabled>
          <option>Departamentos</option>
        </select>

        <select style={styles.select} disabled>
          <option>Setores</option>
        </select>
      </div>

      <div style={styles.rightGroup}>
        <div style={styles.orderGroup}>
          <span style={styles.orderLabel}>Ordem:</span>
          <select style={styles.orderSelect} disabled>
            <option>Nome</option>
          </select>
        </div>

        <button type="button" onClick={onNovo} style={styles.button}>
          Novo vínculo
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    flex: 1,
    minWidth: "280px",
  },

  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "0 12px",
    minWidth: "240px",
    flex: 1,
    maxWidth: "340px",
    height: "42px",
    boxSizing: "border-box",
  },

  searchIcon: {
    fontSize: "14px",
    color: "#9ca3af",
    flexShrink: 0,
  },

  input: {
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    width: "100%",
    fontSize: "14px",
    color: "#374151",
  },

  select: {
    height: "42px",
    padding: "0 12px",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    backgroundColor: "#93c5fd",
    color: "#1e3a8a",
    fontSize: "13px",
    fontWeight: "600",
    outline: "none",
    cursor: "not-allowed",
    opacity: 0.9,
  },

  orderGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  orderLabel: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "500",
  },

  orderSelect: {
    height: "42px",
    padding: "0 12px",
    border: "1px solid #dbeafe",
    borderRadius: "10px",
    backgroundColor: "#93c5fd",
    color: "#1e3a8a",
    fontSize: "13px",
    fontWeight: "600",
    outline: "none",
    cursor: "not-allowed",
    opacity: 0.9,
  },

  button: {
    height: "42px",
    padding: "0 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#60a5fa",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(96, 165, 250, 0.28)",
  },
};