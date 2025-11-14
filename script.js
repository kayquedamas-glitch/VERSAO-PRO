/*
 * js/app-pro.js
 * (VERSÃO PRO - REVISADA E CORRIGIDA)
 * 1. Garantia de reativação de botões (correção do bug de 'loading').
 * 2. Listeners de evento seguros (não quebra se um elemento não existir).
 * 3. Todas as ferramentas desbloqueadas e sem limite de uso.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. INICIALIZAÇÃO DO FIREBASE ---
    const db = firebase.firestore();

    
    // --- 1. CONFIGURAÇÕES E VARIÁVEIS PRINCIPAIS (PRO) ---
    const MAX_USAGE = 9999999; // Acesso Ilimitado
    const API_URL = "https://long-block-7f38.kayquedamas.workers.dev";
    const API_MODEL = "llama-3.1-8b-instant"; 

    // --- DEFINIÇÕES DAS FERRAMENTAS (TODAS DESBLOQUEADAS) ---
    const toolDefinitions = {
        'Diagnostico': {
            title: "Diagnóstico Bruto",
            subtitle: "Confesse. O que você está fazendo de errado *agora*?",
            systemPrompt: "Você é o 'Diagnóstico Bruto da Synapse'. O usuário vai confessar uma procrastinação ou falha imediata (ex: 'Tô há 1 hora no TikTok', 'Não consigo começar o relatório'). Sua ÚNICA resposta deve ser um diagnóstico de UMA FRASE, brutal, direta e psicológica sobre a causa raiz. Sem 'olá', sem 'bom dia', sem conselhos. Apenas o diagnóstico. Comece com 'DIAGNÓSTICO:'. Ex: 'DIAGNÓSTICO: Você está trocando seu futuro por dopamina barata.' ou 'DIAGNÓSTICO: Você está paralisado pelo perfeccionismo.'",
            isLocked: false 
        },
        'Estrategista': {
            title: "Estrategista Diário",
            subtitle: "Transforme caos em clareza. Diga-me seu maior desafio para hoje e eu criarei um plano de batalha focado.",
            systemPrompt: "Você é o 'Estrategista Diário da Synapse'. Seu único objetivo é criar planos de ação táticos e brutais. O usuário dirá um desafio (ex: 'estudar para prova', 'limpar a casa'). Você deve responder com: 1. **MISSÃO:** (O objetivo claro). 2. **REGRAS DE ENGAJAMENTO:** (3-5 regras curtas para evitar distração). 3. **OBJETIVOS TÁTICOS:** (Um checklist de 3-5 passos acionáveis). Mantenha o tom direto, motivador e militar. Use markdown.",
            isLocked: false 
        },
        'Gerente': {
            title: "Gerente de Energia",
            subtitle: "Sentindo-se sobrecarregado ou sem foco? Descreva seu estado mental e eu darei 3 ações imediatas para recuperar o controle.",
            systemPrompt: "Você é o 'Gerente da Synapse'. O usuário descreverá um estado negativo (ex: 'cansado', 'ansioso', 'sem foco'). Sua única resposta deve ser 3 AÇÕES IMEDIATAS para quebrar o padrão. As ações devem ser físicas ou mentais, simples e rápidas (ex: '1. Levante-se. Beba 500ml de água. 2. Respire fundo 10x. 3. Escreva 1 coisa que você pode fazer agora.'). Sem conversa fiada. Direto ao ponto.",
            isLocked: false 
        },
        'Mestre': {
            title: "Mestre da Disciplina",
            subtitle: "Confesse sua falha. Diga-me onde você procrastinou hoje e eu darei um 'castigo' justo para recalibrar sua disciplina amanhã.",
            systemPrompt: "Você é o 'Mestre da Disciplina da Synapse'. O usuário confessará uma falha de disciplina (ex: 'fiquei 2h no TikTok', 'comi fast-food'). Sua resposta deve ser curta e ter duas partes: 1. **DIAGNÓSTICO BRUTAL:** (Uma frase curta sobre a causa raiz, ex: 'Você buscou dopamina fácil.'). 2. **PUNIÇÃO JUSTA:** (Uma tarefa simples, mas desconfortável, para o dia seguinte, ex: 'Amanhã, 10 minutos de meditação sem celular perto.' ou 'Amanhã, sua primeira hora de trabalho será sem música.'). O tom é severo, mas justo. Sem julgamento moral, apenas causa e efeito.",
            isLocked: false 
        },
        'Auditor': {
            title: "Auditor de Hábitos",
            subtitle: "No fim da semana, cole seus registros diários aqui. Eu analisarei seus padrões e entregarei um relatório honesto sobre sua performance.",
            systemPrompt: "Você é o 'Auditor de Hábitos da Synapse'. O usuário colará um texto longo (provavelmente de vários dias) descrevendo suas ações, falhas e vitórias. Sua tarefa é analisar esse texto e gerar um 'RELATÓRIO DE PERFORMANCE SEMANAL' em 3 seções: 1. **VITÓRIAS:** (Onde o usuário mandou bem). 2. **GARGALOS:** (Onde o usuário falhou repetidamente). 3. **DIRETRIZ DA SEMANA:** (Uma única regra ou foco para a próxima semana). Seja analítico, direto e use os dados do usuário para embasar sua análise. Use markdown.",
            isLocked: false 
        }
    };
    
    // --- ESTADO DO CHAT ---
    let currentTool = 'Diagnostico'; 
    let conversationHistory = []; 
    let currentChatId = null; 

    
    // --- 2. SELETORES DE ELEMENTOS ---
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('openSidebarBtn');
    const closeBtn = document.getElementById('closeSidebarBtn');
    const overlay = document.getElementById('sidebarOverlay');
    
    const chatTitle = document.getElementById('chatTitle');
    const chatSubtitle = document.getElementById('chatSubtitle');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtn');

    
    // --- 3. FUNÇÕES ---

    // --- Funções do Chat ---
    function addMessage(message, isUser, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(isUser ? 'chat-message-user' : 'chat-message-ia');
        
        if (isError) messageDiv.classList.add('brutal-red', 'font-bold');
        
        let formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedMessage = formattedMessage.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formattedMessage = formattedMessage.replace(/\n/g, '<br>');

        messageDiv.innerHTML = formattedMessage;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --- Mudar Ferramenta ---
    function setActiveTool(toolName, isInitialLoad = false) { 
        currentTool = toolName;
        currentChatId = null; 
        const toolInfo = toolDefinitions[toolName];
        
        if (!toolInfo) {
            console.error(`Ferramenta não encontrada: ${toolName}`);
            return;
        }

        conversationHistory = [{ role: "system", content: toolInfo.systemPrompt }];

        document.querySelectorAll('.tool-item').forEach(item => {
            item.classList.toggle('active', item.id === `tool${toolName}`);
        });
        
        chatTitle.textContent = toolInfo.title.toUpperCase();
        chatSubtitle.textContent = toolInfo.subtitle;
        chatInput.placeholder = "Digite sua mensagem aqui..."; // Texto genérico
        
        messagesContainer.innerHTML = ''; 
        
        // Mensagem inicial direta (só o subtítulo)
        
        if ((!isInitialLoad || (isInitialLoad && !isMobile)) && chatInput) {
            chatInput.focus();
        }

        // Lógica de bloqueio NÃO EXISTE AQUI (é a versão PRO)
    } 

    // --- Enviar Mensagem (VERSÃO ROBUSTA) ---
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;

        addMessage(message, true);
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        conversationHistory.push({ role: "user", content: message });
        
        sendBtn.innerHTML = '<div id="loadingSpinner"></div>';
        sendBtn.disabled = true;
        chatInput.disabled = true;

        // Lógica de Timeout (20 segundos)
        const controller = new AbortController();
        const signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), 20000); 

        try {
            const payload = {
                model: API_MODEL,
                messages: conversationHistory,
                temperature: 0.7, 
                max_tokens: 1024,
                stream: false 
            };
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: signal
            });

            clearTimeout(timeoutId); // Resposta chegou, cancela o timeout

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erro da API Groq:", errorData);
                addMessage(`Erro da API: ${errorData.error.message}`, false, true);
                return; // O 'finally' vai rodar
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0].message.content) {
                const iaMessage = data.choices[0].message.content;
                addMessage(iaMessage, false);
                conversationHistory.push({ role: "assistant", content: iaMessage });
                await saveChatToFirestore();
            } else {
                console.warn("Resposta da API vazia:", data);
                addMessage("Recebi uma resposta vazia da IA. Tente novamente.", false, true);
            }

        } catch (error) {
            clearTimeout(timeoutId); 
            if (error.name === 'AbortError') {
                console.error("Erro de Timeout:", error);
                addMessage("Erro: O servidor demorou muito para responder. Tente novamente.", false, true);
            } else {
                console.error("Erro ao enviar mensagem:", error);
                addMessage(`Erro de conexão: ${error.message}`, false, true);
            }
        } finally {
            // ESTE BLOCO AGORA SEMPRE RODA, CORRIGINDO O BUG
            clearTimeout(timeoutId); 
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            sendBtn.disabled = false;
            chatInput.disabled = false; // A linha mais importante
            
            if (chatInput.disabled === false) {
                chatInput.focus();
            }
        }
    } 
    
    // --- Salvar no Firestore ---
    async function saveChatToFirestore() {
        const chatData = {
            ferramenta: currentTool,
            historico: conversationHistory,
            ultimaAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (currentChatId) {
                const chatRef = db.collection("chats").doc(currentChatId);
                await chatRef.update(chatData);
                console.log("Chat atualizado no Firestore (ID:", currentChatId, ")");
            } else {
                const docRef = await db.collection("chats").add(chatData);
                currentChatId = docRef.id;
                console.log("Chat novo salvo no Firestore (ID:", currentChatId, ")");
            }
        } catch (dbError) {
            console.error("Erro ao salvar no Firestore:", dbError);
            addMessage("Aviso: Falha ao salvar o histórico do chat.", false, true);
        }
    }

    // --- Funções do Menu ---
    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('open');
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }

    // --- 4. EVENT LISTENERS E INICIALIZAÇÃO (VERSÃO SEGURA) ---
    
    if (openBtn) openBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    
    document.querySelectorAll('.tool-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const toolName = item.id.replace('tool', '');
            if (toolDefinitions[toolName]) { 
                if (item.classList.contains('active')) {
                    e.preventDefault();
                    return;
                }
                setActiveTool(toolName, false);
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            }
        });
    });

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            setActiveTool(currentTool, false);
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    }

    // --- 5. INICIALIZAÇÃO DA PÁGINA ---
    setActiveTool('Diagnostico', true); 

}); // Fim do 'DOMContentLoaded'