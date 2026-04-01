export default function Alerta({ tipo = "sucesso", mensagem, onFechar }) {
  if (!mensagem) {
    return null;
  }

  const estilosPorTipo = {
    sucesso: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    },
    erro: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fca5a5",
    },
    aviso: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fcd34d",
    },
  };

  return (
    <div
      style={{
        ...styles.box,
        ...(estilosPorTipo[tipo] || estilosPorTipo.sucesso),
      }}
    >
      <span>{mensagem}</span>

      <button type="button" onClick={onFechar} style={styles.botaoFechar}>
        ×
      </button>
    </div>
  );
}

const styles = {
  box: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "14px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  botaoFechar: {
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
    color: "inherit",
    lineHeight: 1,
  },
};