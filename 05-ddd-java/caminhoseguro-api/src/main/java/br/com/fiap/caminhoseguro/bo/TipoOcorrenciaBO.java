package br.com.fiap.caminhoseguro.bo;

import br.com.fiap.caminhoseguro.dao.TipoOcorrenciaDAO;
import br.com.fiap.caminhoseguro.model.TipoOcorrencia;
import java.util.List;
import org.springframework.stereotype.Service;

/** Tipos de ocorrência: tabela de domínio, só consulta. */
@Service
public class TipoOcorrenciaBO {

    private final TipoOcorrenciaDAO tipoOcorrenciaDAO;

    public TipoOcorrenciaBO(TipoOcorrenciaDAO tipoOcorrenciaDAO) {
        this.tipoOcorrenciaDAO = tipoOcorrenciaDAO;
    }

    public List<TipoOcorrencia> listar() {
        return tipoOcorrenciaDAO.listar();
    }
}
