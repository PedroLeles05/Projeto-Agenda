# 📅 Projeto-Agenda

Uma aplicação web completa (Full-Stack) no formato de *Landing Page* projetada para facilitar o agendamento de serviços online. O sistema permite que prestadores de serviços gerenciem seus horários e agendamentos, enquanto clientes podem visualizar a disponibilidade e marcar horários de forma simples e intuitiva.

---

## 🚀 Tecnologias Utilizadas

### Backend & Banco de Dados
* **Node.js**: Ambiente de execução JavaScript no servidor.
* **Express.js**: Framework para estruturação da API.
* **MongoDB & Mongoose**: Banco de dados NoSQL e biblioteca ODM para modelagem dos dados.

### Frontend
* **HTML5 & JavaScript (Vanilla)**: Estrutura da página e lógica do lado do cliente.
* **Tailwind CSS**: Framework utilitário para estilização e responsividade.

---

## 🛠️ Funcionalidades do Projeto

### 🧑‍💼 Para Usuários Cadastrados (Prestadores de Serviço)
* **Cadastro e Login**: Acesso seguro e restrito ao painel de controle.
* **Gerenciamento de Serviços**: Criação de serviços personalizados com definição de **tempo de duração** e **valor**.
* **Definição de Jornada de Trabalho**: Configuração exata dos dias e horários em que o prestador está disponível para trabalhar.
* **Painel de Agendamentos (Dashboard)**:
    * Visualização detalhada de reservas (quem agendou, qual serviço, dia e horário).
    * Acesso às informações preenchidas pelo cliente.
    * Alteração e gerenciamento do **status** de cada agendamento (ex: pendente, confirmado, cancelado).
* **Controle de Serviços**: Gerenciamento de status dos serviços oferecidos na plataforma.

### 👥 Para Usuários Não Cadastrados (Clientes)
* **Navegação na Landing Page**: Interface limpa (single-page) para visualização rápida de todos os serviços disponíveis.
* **Sistema de Agendamento Inteligente**: Ao clicar em um serviço, o sistema exibe todas as informações relevantes e cruza os dados para mostrar **apenas os dias e horários livres** daquele prestador.
* **Reserva Prática**: Formulário integrado para o cliente preencher seus dados pessoais e confirmar a solicitação do agendamento.

---

## 🔧 Como Executar o Projeto Localmente

O projeto é dividido entre a API (backend) e a Landing Page (frontend). Para rodar localmente, siga os passos abaixo:

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado.
* [Git](https://git-scm.com/) instalado.
* VS Code com a extensão **Live Server** instalada.

### Passo a Passo

1. **Clone o repositório:**
```bash
   git clone [https://github.com/PedroLeles05/Projeto-Agenda.git](https://github.com/PedroLeles05/Projeto-Agenda.git)
   ```

2. **Acesse a pasta do projeto:**
```bash
   cd Projeto-Agenda
   ```

3. **Inicie o Backend (API e Banco de Dados):**
   * Instale as dependências do Node:
```bash
     npm install
     ```
   * Ligue o servidor da API (que também fará a conexão com o MongoDB):
```bash
     node server.js
     ```

4. **Inicie o Frontend:**
   * Com o VS Code aberto na pasta do projeto, localize o arquivo principal do frontend (como o `index.html`).
   * Clique com o botão direito do mouse sobre ele e selecione **"Open with Live Server"**.
   * O navegador abrirá a Landing Page automaticamente, já conectada à sua API rodando no terminal.

---

## 📂 Estrutura e Arquitetura
O projeto foi pensado para ser enxuto e direto. Sendo uma **Landing Page**, toda a navegação e interação do cliente com os serviços ocorrem em um fluxo contínuo e sem perda de contexto, enquanto a administração acontece em um painel isolado para o criador do serviço.
