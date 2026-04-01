export default function TabelaFuncionarios({
  funcionarios,
  loading,
  error,
  onEditar,
  onExcluir,
}) {
  if (loading) {
    return (
      <div style={styles.messageCard}>
        <p style={styles.messageText}>Carregando funcionários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.messageCard}>
        <p style={styles.errorText}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Nome</th>
            <th style={styles.th}>CPF</th>
            <th style={styles.th}>Cargo</th>
            <th style={styles.th}>Setor</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.length > 0 ? (
            funcionarios.map((funcionario) => (
              <tr key={funcionario.id}>
                <td style={styles.td}>{funcionario.id}</td>
                <td style={styles.td}>{funcionario.nome}</td>
                <td style={styles.td}>{funcionario.cpf}</td>
                <td style={styles.td}>{funcionario.cargo}</td>
                <td style={styles.td}>{funcionario.setor}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor:
                        funcionario.status === "Ativo" ? "#dcfce7" : "#fee2e2",
                      color:
                        funcionario.status === "Ativo" ? "#166534" : "#991b1b",
                    }}
                  >
                    {funcionario.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.editButton}
                      onClick={() => onEditar(funcionario)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      style={styles.deleteButton}
                      onClick={() => onExcluir(funcionario)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={styles.empty} colSpan={7}>
                Nenhum funcionário encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "14px 12px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px",
    color: "#374151",
    backgroundColor: "#f9fafb",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    verticalAlign: "middle",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  editButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  empty: {
    padding: "20px",
    textAlign: "center",
    color: "#6b7280",
  },
  messageCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "30px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  messageText: {
    fontSize: "15px",
    color: "#374151",
  },
  errorText: {
    fontSize: "15px",
    color: "#b91c1c",
    fontWeight: "bold",
  },
};