export default function Toolbar({ search, setSearch, onNovo }) {
  return (
    <div style={styles.toolbar}>
      <input
        type="text"
        placeholder="Buscar funcionário por nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.input}
      />

      <button type="button" onClick={onNovo} style={styles.button}>
        + Novo Funcionário
      </button>
    </div>
  );
}

const styles = {
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: "260px",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    outline: "none",
  },
  button: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};