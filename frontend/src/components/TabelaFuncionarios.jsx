function obterIniciais(nome) {
  const texto = String(nome || "").trim();

  if (!texto) {
    return "FN";
  }

  const partes = texto.split(/\s+/).filter(Boolean);

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0] || ""}${partes[1][0] || ""}`.toUpperCase();
}

function AvatarFuncionario({ nome, foto }) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={nome || "Funcionário"}
        style={styles.avatarImage}
      />
    );
  }

  return <div style={styles.avatarFallback}>{obterIniciais(nome)}</div>;
}

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

  if (!funcionarios || funcionarios.length === 0) {
    return (
      <div style={styles.messageCard}>
        <p style={styles.messageText}>Nenhum funcionário encontrado.</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.grid}>
        {funcionarios.map((funcionario) => {
          const statusNormalizado = String(funcionario.status || "")
            .trim()
            .toLowerCase();

          const statusAtivo =
            statusNormalizado === "ativo" ||
            statusNormalizado === "active" ||
            statusNormalizado === "integrado";

          return (
            <div key={funcionario.id} style={styles.card}>
              <AvatarFuncionario
                nome={funcionario.nome}
                foto={funcionario.foto}
              />

              <div style={styles.idText}>
                ID ERP - {funcionario.col_pessoa || funcionario.id || "000"}
              </div>

              <div style={styles.nome} title={funcionario.nome || ""}>
                {funcionario.nome || "Funcionário sem nome"}
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Setor</span>
                  <span style={styles.infoValue}>
                    {funcionario.setor_nome ||
                      funcionario.setor ||
                      funcionario.departamento_nome ||
                      "-"}
                  </span>
                </div>

                <div style={styles.infoDivider}></div>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Departamento</span>
                  <span style={styles.infoValue}>
                    {funcionario.departamento_nome ||
                      funcionario.setor ||
                      funcionario.setor_nome ||
                      "-"}
                  </span>
                </div>
              </div>

              <div style={styles.extraInfo}>
                <div style={styles.chipPrimary}>
                  {funcionario.cargo_rh_nome || "Sem cargo RH"}
                </div>

                <div
                  style={{
                    ...styles.chipNeutral,
                    ...(statusAtivo ? styles.chipSuccess : styles.chipDanger),
                  }}
                >
                  {funcionario.status || "Sem status"}
                </div>
              </div>

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

              <div style={styles.footerInfo}>
                <div style={styles.footerLine}>
                  <span style={styles.footerLabel}>CPF:</span>
                  <span style={styles.footerValue}>
                    {funcionario.cpf || "-"}
                  </span>
                </div>

                <div style={styles.footerLine}>
                  <span style={styles.footerLabel}>Cargo ERP:</span>
                  <span style={styles.footerValue}>
                    {funcionario.cargo_oficial || "-"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "22px",
    padding: "22px 18px 18px 18px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    border: "1px solid #edf1f5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "320px",
    boxSizing: "border-box",
  },

  avatarImage: {
    width: "62px",
    height: "62px",
    borderRadius: "999px",
    objectFit: "cover",
    marginBottom: "12px",
    border: "2px solid #dbeafe",
  },

  avatarFallback: {
    width: "62px",
    height: "62px",
    borderRadius: "999px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "18px",
    marginBottom: "12px",
    border: "2px solid #bfdbfe",
  },

  idText: {
    fontSize: "11px",
    color: "#9ca3af",
    marginBottom: "8px",
    textAlign: "center",
  },

  nome: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: "14px",
    minHeight: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1.2,
  },

  infoBox: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: "14px",
    border: "1px solid #f1f5f9",
    overflow: "hidden",
    marginBottom: "14px",
  },

  infoRow: {
    display: "grid",
    gridTemplateColumns: "90px 1fr",
    alignItems: "center",
    minHeight: "38px",
    padding: "0 12px",
    columnGap: "8px",
  },

  infoDivider: {
    height: "1px",
    backgroundColor: "#e5e7eb",
    width: "100%",
  },

  infoLabel: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
  },

  infoValue: {
    fontSize: "11px",
    color: "#374151",
    textAlign: "right",
    fontWeight: "500",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  extraInfo: {
    width: "100%",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "14px",
  },

  chipPrimary: {
    backgroundColor: "#dbeafe",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "700",
    padding: "6px 10px",
    borderRadius: "999px",
    maxWidth: "100%",
    textAlign: "center",
  },

  chipNeutral: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "6px 10px",
    borderRadius: "999px",
    textAlign: "center",
  },

  chipSuccess: {
    backgroundColor: "#e5f9ed",
    color: "#15803d",
  },

  chipDanger: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
  },

  actions: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  editButton: {
    padding: "8px 14px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#60a5fa",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(96, 165, 250, 0.25)",
  },

  deleteButton: {
    padding: "8px 14px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
  },

  footerInfo: {
    width: "100%",
    marginTop: "auto",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  footerLine: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
  },

  footerLabel: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "700",
    flexShrink: 0,
  },

  footerValue: {
    fontSize: "11px",
    color: "#374151",
    textAlign: "right",
    wordBreak: "break-word",
  },

  messageCard: {
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    padding: "30px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    border: "1px solid #edf1f5",
  },

  messageText: {
    fontSize: "15px",
    color: "#374151",
    margin: 0,
  },

  errorText: {
    fontSize: "15px",
    color: "#b91c1c",
    fontWeight: "700",
    margin: 0,
  },
};