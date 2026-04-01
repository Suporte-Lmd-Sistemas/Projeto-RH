export default function ConfirmModal({
  aberto,
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
}) {
  if (!aberto) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.titulo}>{titulo}</h2>
        <p style={styles.mensagem}>{mensagem}</p>

        <div style={styles.acoes}>
          <button type="button" onClick={onCancelar} style={styles.botaoCancelar}>
            Cancelar
          </button>

          <button type="button" onClick={onConfirmar} style={styles.botaoConfirmar}>
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
  },
  modal: {
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  },
  titulo: {
    fontSize: "22px",
    marginBottom: "12px",
    color: "#0f172a",
  },
  mensagem: {
    fontSize: "15px",
    color: "#475569",
    marginBottom: "24px",
    lineHeight: 1.5,
  },
  acoes: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },
  botaoCancelar: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontWeight: "bold",
    cursor: "pointer",
  },
  botaoConfirmar: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};