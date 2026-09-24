
# CONSTRUA O APLICATIVO COMPLETO — CONTROLE DE ENERGIA E ÁGUA

Você é um engenheiro de software full-stack sênior. Construa um aplicativo web completo, funcional e pronto para execução, seguindo rigorosamente todos os requisitos abaixo.

Não entregue apenas protótipos, wireframes ou telas estáticas. Implemente a lógica, persistência local, cálculos, validações, histórico, fechamento mensal, cancelamento, backup/restauração, funcionamento offline e PWA.

## 1. TECNOLOGIAS

Utilize:

* Next.js
* TypeScript
* React
* PWA
* IndexedDB para armazenamento local
* Interface responsiva para mobile, tablet e desktop

O aplicativo deve funcionar totalmente no navegador e continuar funcionando sem internet depois de carregado/instalado.

Não utilize backend, banco de dados externo ou serviços externos.

## 2. OBJETIVO

Criar um aplicativo para controlar mensalmente os custos de energia elétrica e água de uma propriedade com até 20 moradores.

A propriedade possui:

* Um medidor de energia para cada morador.
* Um medidor de água para cada morador.
* Um medidor exclusivamente de energia para o poço.
* Uma conta mensal de energia elétrica cujo valor será informado pelo usuário.

O poço NÃO possui medidor de água.

## 3. ARMAZENAMENTO

Utilize IndexedDB como armazenamento principal.

Todos os dados devem permanecer localmente no dispositivo.

Estruture o armazenamento de forma organizada, permitindo consultar e atualizar:

* moradores
* competências
* leituras
* contas de energia
* ajustes
* cálculos
* fechamentos
* cancelamentos
* configurações

Os dados devem continuar disponíveis mesmo após fechar e abrir novamente o aplicativo.

## 4. MORADORES

Permitir cadastrar no máximo 20 moradores.

Cada morador deve possuir:

* ID único
* Nome
* Identificação/unidade
* Status ativo/inativo
* Data de cadastro

Permitir:

* adicionar
* editar
* desativar
* reativar

Nunca apagar o histórico de um morador ao desativá-lo.

Moradores inativos não devem aparecer para novos lançamentos, mas seu histórico deve permanecer disponível.

## 5. COMPETÊNCIA

Cada lançamento pertence a uma competência:

* mês
* ano

Não permitir duas competências iguais.

Cada competência possui um status:

* aberta
* fechada
* cancelada

## 6. LANÇAMENTO MENSAL

Criar uma tela/formulário clara para registrar uma competência.

Campos informados pelo usuário:

### Competência

* Mês
* Ano

### Conta de energia

* Valor da conta em R$

### Poço

* Leitura atual do medidor de energia

### Cada morador

* Leitura atual de energia
* Leitura atual de água
* Ajuste em R$

O ajuste pode ser positivo, negativo ou zero.

## 7. LEITURAS

O sistema deve armazenar todas as leituras.

Ao criar uma nova competência, buscar automaticamente a última leitura válida daquele medidor.

Fórmula:

CONSUMO = LEITURA ATUAL - LEITURA ANTERIOR

No primeiro lançamento de qualquer medidor:

LEITURA ANTERIOR = 0

Nunca utilizar um lançamento cancelado como leitura anterior.

Não permitir que:

LEITURA ATUAL < LEITURA ANTERIOR

Quando isso ocorrer, mostrar uma mensagem clara ao usuário e impedir o salvamento.

## 8. CÁLCULO DA ENERGIA

Para cada morador:

CONSUMO DE ENERGIA DO MORADOR =
LEITURA ATUAL DE ENERGIA -
LEITURA ANTERIOR DE ENERGIA

Para o poço:

CONSUMO DE ENERGIA DO POÇO =
LEITURA ATUAL DO POÇO -
LEITURA ANTERIOR DO POÇO

Depois:

CONSUMO TOTAL DE ENERGIA =
SOMA DO CONSUMO DE ENERGIA DOS MORADORES +
CONSUMO DE ENERGIA DO POÇO

Então:

R$/kWh =
VALOR DA CONTA DE ENERGIA /
CONSUMO TOTAL DE ENERGIA

Todos os campos calculados devem aparecer visualmente identificados com:

"(automático)"

## 9. CÁLCULO DA ÁGUA

Para cada morador:

CONSUMO DE ÁGUA =
LEITURA ATUAL DE ÁGUA -
LEITURA ANTERIOR DE ÁGUA

Depois:

CONSUMO TOTAL DE ÁGUA =
SOMA DO CONSUMO DE ÁGUA DE TODOS OS MORADORES

Calcular:

CUSTO DE ENERGIA DO POÇO =
CONSUMO DE ENERGIA DO POÇO × R$/kWh

Depois:

R$/m³ =
CUSTO DE ENERGIA DO POÇO /
CONSUMO TOTAL DE ÁGUA

Não existe medidor de água do poço.

## 10. CÁLCULO INDIVIDUAL

Para cada morador:

CUSTO DE ENERGIA =
CONSUMO DE ENERGIA × R$/kWh

CUSTO DE ÁGUA =
CONSUMO DE ÁGUA × R$/m³

TOTAL =
CUSTO DE ENERGIA +
CUSTO DE ÁGUA +
AJUSTE

O ajuste pode aumentar ou reduzir o valor.

Exemplo:

Energia: R$ 50,00
Água: R$ 30,00
Ajuste: -R$ 5,00

Total:

R$ 75,00

## 11. PRECISÃO E ARREDONDAMENTO

Valores monetários devem ser apresentados com duas casas decimais.

Evite erros de arredondamento.

Sempre que possível, mantenha os valores internos com precisão adequada e arredonde para exibição/cobrança conforme uma regra consistente.

## 12. DIVISÃO POR ZERO

Tratar explicitamente situações em que:

* consumo total de energia = 0
* consumo total de água = 0

Nunca apresentar NaN, Infinity ou valores quebrados para o usuário.

Mostrar uma mensagem explicando que o cálculo não pode ser realizado enquanto não houver consumo suficiente.

## 13. RESUMO DO MORADOR

Para cada morador, mostrar:

* Nome
* Leitura anterior de energia
* Leitura atual de energia
* Consumo de energia (automático)
* Custo de energia (automático)
* Leitura anterior de água
* Leitura atual de água
* Consumo de água (automático)
* Custo de água (automático)
* Ajuste
* Total (automático)

## 14. DASHBOARD

Criar uma tela inicial/dashboard.

Mostrar a competência selecionada e:

* Valor da conta de energia
* Consumo total de energia
* R$/kWh
* Consumo de energia do poço
* Custo do poço
* Consumo total de água
* R$/m³
* Quantidade de moradores ativos
* Total geral dos valores dos moradores

Criar uma apresentação visual simples, limpa e fácil de entender.

## 15. HISTÓRICO

Criar uma área de histórico.

Permitir consultar competências anteriores.

Para cada competência mostrar:

* mês/ano
* valor da conta
* consumo total de energia
* R$/kWh
* consumo do poço
* custo do poço
* consumo total de água
* R$/m³
* moradores
* valores individuais
* ajustes
* status
* data/hora do lançamento
* data/hora do fechamento
* informações de cancelamento, quando houver

Permitir abrir uma competência para visualizar seus detalhes.

## 16. CANCELAMENTO

Permitir cancelar uma competência.

Nunca apagar fisicamente os dados.

Ao cancelar:

* alterar status para "cancelada"
* preservar todos os dados
* preservar histórico
* retirar a competência dos cálculos ativos
* impedir que suas leituras sejam utilizadas como leituras anteriores

Solicitar confirmação antes do cancelamento.

## 17. FECHAMENTO MENSAL

Uma competência aberta pode ser revisada e fechada.

Fluxo:

1. Preencher lançamento
2. Calcular automaticamente
3. Revisar
4. Confirmar
5. Fechar competência

Ao fechar:

* bloquear alterações acidentais
* registrar data/hora do fechamento
* manter todos os valores calculados
* permitir consulta no histórico

Deve existir opção para reabrir uma competência.

A reabertura deve exigir confirmação.

Ao reabrir, permitir correções e recalcular os valores.

## 18. DATAS

Registrar:

* data/hora de criação
* data/hora da última alteração
* data/hora do fechamento
* data/hora do cancelamento
* data/hora da reabertura

## 19. VALIDAÇÕES

Implementar validações para:

* campos obrigatórios
* competência duplicada
* valores numéricos inválidos
* leituras inválidas
* leitura atual menor que anterior
* conta de energia inválida
* divisão por zero
* tentativa de alterar competência fechada
* backup inválido

Mostrar mensagens de erro claras e próximas ao campo correspondente.

## 20. CONFIGURAÇÕES

Criar tela de configurações para:

* nome da propriedade
* dados gerais
* preferências da aplicação
* parâmetros necessários ao funcionamento

Não criar configurações desnecessárias.

## 21. BACKUP

Criar funcionalidade:

"Exportar backup"

O aplicativo deve gerar um arquivo `.json`.

O backup deve conter TODOS os dados necessários para restaurar o aplicativo:

* moradores
* status
* competências
* leituras
* contas
* ajustes
* cálculos
* histórico
* fechamentos
* cancelamentos
* configurações

## 22. RESTAURAÇÃO

Criar funcionalidade:

"Importar backup"

Fluxo:

1. Selecionar arquivo JSON
2. Validar estrutura
3. Validar dados
4. Informar ao usuário o que será restaurado
5. Solicitar confirmação
6. Restaurar os dados
7. Atualizar a interface

Não importar arquivos inválidos.

## 23. TRANSFERÊNCIA DE DISPOSITIVO

O backup deve permitir:

Celular antigo
→ Exportar JSON
→ Transferir arquivo
→ Celular novo
→ Importar JSON
→ Dados restaurados

O mesmo deve funcionar entre desktop e mobile.

## 24. INTERFACE

A interface deve ser:

* limpa
* moderna
* simples
* objetiva
* responsiva
* fácil de usar no celular
* confortável no desktop

Priorize usabilidade.

Não criar excesso de menus ou funcionalidades.

## 25. RESPONSIVIDADE

O aplicativo deve funcionar integralmente em:

* celular
* tablet
* notebook
* desktop

Não criar uma versão mobile separada.

Utilizar layout responsivo.

No celular:

* formulários devem ser fáceis de preencher
* tabelas devem se adaptar à tela
* botões devem ser fáceis de tocar
* navegação deve ser simples

No desktop:

* aproveitar melhor o espaço horizontal
* permitir visualização confortável de tabelas e resumos

Todas as funcionalidades devem estar disponíveis em ambos.

## 26. PWA

Configurar o aplicativo como PWA.

Incluir:

* manifest
* ícone
* instalação
* funcionamento offline
* cache dos recursos necessários
* comportamento adequado quando instalado

## 27. NAVEGAÇÃO

Criar uma navegação simples, contendo no mínimo:

* Dashboard
* Lançamento mensal
* Histórico
* Moradores
* Configurações

As funções de backup podem ficar em Configurações.

## 28. EXPERIÊNCIA DO LANÇAMENTO

A tela de lançamento deve permitir preencher os dados de forma prática.

Sugestão de organização:

### Cabeçalho

* Competência
* Valor da conta

### Poço

* Leitura anterior (automático)
* Leitura atual
* Consumo (automático)

### Moradores

Para cada morador:

* Nome
* Energia anterior (automático)
* Energia atual
* Consumo energia (automático)
* Água anterior (automático)
* Água atual
* Consumo água (automático)
* Custo energia (automático)
* Custo água (automático)
* Ajuste
* Total (automático)

### Resumo

* Consumo total energia
* R$/kWh
* Consumo poço
* Custo poço
* Consumo total água
* R$/m³
* Total geral

### Ações

* Salvar lançamento
* Limpar formulário
* Fechar competência
* Cancelar competência, quando aplicável

## 29. REGRAS IMPORTANTES

Não altere estas regras:

1. O poço possui somente medidor de energia.
2. Cada morador possui medidor de energia e água.
3. O primeiro lançamento usa leitura anterior igual a zero.
4. O último lançamento válido fornece a leitura anterior.
5. Lançamentos cancelados não são utilizados como referência.
6. O valor da conta determina o R$/kWh.
7. O consumo do poço determina o custo energético utilizado no cálculo da água.
8. O R$/m³ é calculado dividindo o custo energético do poço pelo consumo total de água.
9. Ajustes podem ser positivos ou negativos.
10. Competências fechadas não devem ser alteradas acidentalmente.
11. Histórico nunca deve ser perdido por cancelamento.
12. Todos os cálculos devem ser automáticos.
13. Campos calculados devem estar identificados como "(automático)".
14. O aplicativo deve funcionar offline.
15. O aplicativo deve funcionar completamente em mobile e desktop.
16. Os dados devem ser armazenados localmente.
17. Backup e restauração devem funcionar através de JSON.

## 30. ENTREGA

Não entregue apenas explicações.

Crie o projeto completo com:

* código-fonte
* estrutura de pastas
* componentes
* páginas
* estilos
* banco IndexedDB
* modelos/tipos TypeScript
* lógica de cálculo
* validações
* histórico
* fechamento
* cancelamento
* backup
* restauração
* PWA
* responsividade
* tratamento de erros

O projeto deve ser executável imediatamente após a instalação das dependências.

Inclua:

* `package.json`
* configuração do Next.js
* configuração do PWA
* configuração do TypeScript
* código completo
* instruções mínimas para executar

## 31. QUALIDADE DO CÓDIGO

Organize o projeto de maneira profissional.

Separe:

* componentes
* páginas
* modelos/tipos
* regras de negócio
* persistência IndexedDB
* validações
* utilitários
* backup/restauração

Evite colocar toda a lógica em um único arquivo.

As regras de cálculo devem ficar centralizadas para evitar inconsistências.

## 32. DADOS DE TESTE

Inclua uma forma simples de testar o sistema com dados fictícios, mas não misture esses dados com os dados reais do usuário.

Se criar dados de demonstração, permita removê-los facilmente.

## 33. CRITÉRIO DE CONCLUSÃO

Considere o projeto concluído somente quando for possível:

1. Abrir o aplicativo.
2. Cadastrar moradores.
3. Criar uma competência.
4. Informar o valor da conta.
5. Informar as leituras.
6. Ter as leituras anteriores preenchidas automaticamente.
7. Calcular todos os consumos.
8. Calcular R$/kWh.
9. Calcular custo do poço.
10. Calcular R$/m³.
11. Calcular o valor de cada morador.
12. Aplicar ajustes positivos ou negativos.
13. Visualizar o resumo.
14. Salvar a competência.
15. Fechar a competência.
16. Consultar o histórico.
17. Reabrir uma competência.
18. Cancelar uma competência sem perder o histórico.
19. Exportar backup.
20. Importar backup.
21. Fechar e reabrir o aplicativo mantendo os dados.
22. Usar o aplicativo offline.
23. Usar o aplicativo no celular.
24. Usar o aplicativo no desktop.

Antes de considerar o trabalho concluído, faça uma revisão do código e teste os principais fluxos e cálculos.

Se encontrar algum problema, corrija-o antes de finalizar.

IMPORTANTE: não substitua funcionalidades por mocks, dados estáticos ou exemplos visuais. Tudo que foi especificado acima deve funcionar de verdade no aplicativo.
