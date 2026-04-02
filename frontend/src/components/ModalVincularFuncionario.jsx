import { useEffect, useState } from "react";

export default function ModalVincularFuncionario({
  aberto,
  onFechar,
  onSalvar,
  onBuscar,
  colaboradores = [],
  setores = [],
  cargos = [],
  loading = false,
}) {
  const [search, setSearch] = useState("");
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState(null);
  const [departamentoId, setDepartamentoId] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (aberto) {
      setSearch("");
      setColaboradorSelecionado(null);
      setDepartamentoId("");
      setCargoId("");
      setSaving(false);
    }
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    const timer = setTimeout(() => {
      onBuscar(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, aberto, onBuscar]);

  function selecionarColaborador(colaborador) {
    setColaboradorSelecionado(colaborador);
  }

  async function handleSalvar() {
    if (!colaboradorSelecionado) {
      alert("Selecione um colaborador do ERP.");
      return;
    }

    if (!String(departamentoId).trim()) {
      alert("Selecione um setor.");
      return;
    }

    try {
      setSaving(true);

      await onSalvar({
        col_pessoa: colaboradorSelecionado.col_pessoa,
        departamento_id: Number(departamentoId),
        cargo_id: String(cargoId).trim() ? Number(cargoId) : null,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!aberto) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Vincular Colaborador ERP</h2>
            <p style={styles.subtitle}>
              Busque um colaborador do ERP e defina o vínculo interno do RH.
            </p>
          </div>

          <button onClick={onFechar} style={styles.closeButton}>
            ×
          </button>
        </div>

        <div style={styles.content}>
          {/* BUSCA */}
          <div style={styles.searchSection}>
            <label style={styles.label}>Buscar colaborador</label>

            <input
              type="text"
              placeholder="Digite nome, CPF ou cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* LISTA ERP */}
          <div style={styles.listSection}>
            {loading ? (
              <p style={styles.infoText}>Buscando colaboradores no ERP...</p>
            ) : colaboradores.length === 0 ? (
              <p style={styles.infoText}>
                Nenhum colaborador disponível para vinculação.
              </p>
            ) : (
              colaboradores.map((colaborador) => {
                const selecionado =
                  colaboradorSelecionado?.col_pessoa === colaborador.col_pessoa;

                return (
                  <button
                    key={colaborador.col_pessoa}
                    type="button"
                    onClick={() => selecionarColaborador(colaborador)}
                    style={{
                      ...styles.card,
                      ...(selecionado && styles.cardSelected),
                    }}
                  >
                    <div style={styles.cardNome}>{colaborador.nome}</div>

                    <div style={styles.cardLinha}>
                      <strong>CPF:</strong> {colaborador.cpf || "-"}
                    </div>

                    <div style={styles.cardLinha}>
                      <strong>Cargo ERP:</strong>{" "}
                      {colaborador.cargo_oficial || "-"}
                    </div>

                    <div style={styles.cardLinha}>
                      <strong>Status:</strong> {colaborador.status || "-"}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* CONFIGURAÇÃO RH */}
          <div style={styles.configSection}>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Cargo RH</label>

                <select
                  value={cargoId}
                  onChange={(e) => setCargoId(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Sem cargo RH</option>

                  {cargos.map((cargo, index) => (
                    <option key={cargo.id ?? index} value={cargo.id}>
                      {cargo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Setor (Departamento RH)</label>

                <select
                  value={departamentoId}
                  onChange={(e) => setDepartamentoId(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Selecione um setor</option>

                  {setores.map((setor, index) => (
                    <option key={setor.id ?? index} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          {colaboradorSelecionado && (
            <div style={styles.preview}>
              <div style={styles.previewTitle}>Colaborador selecionado</div>

              <div>
                <strong>{colaboradorSelecionado.nome}</strong>
              </div>

              <div>CPF: {colaboradorSelecionado.cpf || "-"}</div>

              <div>
                Cargo ERP: {colaboradorSelecionado.cargo_oficial || "-"}
              </div>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div style={styles.actions}>
          <button onClick={onFechar} style={styles.cancelButton}>
            Cancelar
          </button>

          <button
            onClick={handleSalvar}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? "Vinculando..." : "Vincular Colaborador"}
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
    backgroundColor: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "920px",
    maxHeight: "90vh",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    padding: "22px 24px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
  },

  title: {
    margin: 0,
    fontSize: "22px",
  },

  subtitle: {
    marginTop: "6px",
    fontSize: "14px",
    color: "#6b7280",
  },

  closeButton: {
    fontSize: "26px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },

  content: {
    padding: "20px 24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  searchSection: {},

  listSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))",
    gap: "12px",
    maxHeight: "320px",
    overflowY: "auto",
  },

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "left",
    cursor: "pointer",
  },

  cardSelected: {
    border: "2px solid #3b82f6",
    backgroundColor: "#eff6ff",
  },

  cardNome: {
    fontWeight: "700",
    marginBottom: "6px",
  },

  cardLinha: {
    fontSize: "13px",
    color: "#374151",
  },

  configSection: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "16px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
  },

  preview: {
    border: "1px solid #bfdbfe",
    backgroundColor: "#eff6ff",
    borderRadius: "10px",
    padding: "12px",
  },

  previewTitle: {
    fontWeight: "700",
    marginBottom: "4px",
  },

  actions: {
    padding: "20px 24px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },

  cancelButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
  },

  saveButton: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#22c55e",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  infoText: {
    fontSize: "14px",
    color: "#6b7280",
  },
};