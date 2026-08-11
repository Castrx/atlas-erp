package com.atlas.backend;

import com.atlas.backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

/**
 * Teste de contexto original do projeto. Passou a estender
 * AbstractIntegrationTest para rodar contra o Postgres efêmero do
 * Testcontainers em vez do banco de desenvolvimento — antes exigia
 * `docker compose up -d postgres` rodando manualmente antes de `mvn test`;
 * agora `mvn test` sobe seu próprio banco sozinho (segue exigindo o Docker
 * em execução, mesmo pré-requisito já documentado em CONTRIBUTING.md).
 */
class BackendApplicationTests extends AbstractIntegrationTest {

	@Test
	void contextLoads() {
	}

}
