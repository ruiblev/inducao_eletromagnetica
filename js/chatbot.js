// ── Simulated AI Chatbot (Keyword Heuristics) ────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatbot-container');
    const btnOpen = document.getElementById('btn-chat-open');
    const btnClose = document.getElementById('btn-chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-chat-send');

    // Toggle Chat
    btnOpen.addEventListener('click', () => {
        chatContainer.style.display = 'flex';
        btnOpen.style.display = 'none';
        chatInput.focus();
    });

    btnClose.addEventListener('click', () => {
        chatContainer.style.display = 'none';
        btnOpen.style.display = 'flex';
    });

    // Send Message
    const sendMessage = () => {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatInput.value = '';

        // Simulate thinking delay
        const typingId = appendMessage('A pensar...', 'bot', true);

        setTimeout(() => {
            removeMessage(typingId);
            const response = generateBotResponse(text);
            appendMessage(response, 'bot');
        }, 600 + Math.random() * 800);
    };

    btnSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    let msgCounter = 0;
    function appendMessage(text, sender, isTyping = false) {
        const id = 'msg-' + msgCounter++;
        const div = document.createElement('div');
        div.id = id;
        div.className = `chat-msg ${sender}-msg ${isTyping ? 'bot-typing' : ''}`;
        div.innerHTML = text; // allow bolding in responses
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // ── Heuristic "ML" Engine (Enhanced) ─────────────────────────────────────────
    function generateBotResponse(input) {
        const query = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
        const hasAny = (...words) => words.some(w => query.includes(w));
        const hasAll = (...words) => words.every(w => query.includes(w));

        // ── 1. Relações Dinâmicas (Causa e Efeito no Gráfico e Fórmulas) ──

        // Relational Analytics: FEM vs Flux (Defasamento)
        if (hasAny('relacao', 'ligacao', 'explicar') && hasAny('fem', 'eletromotriz', 'grafico vermelho', 'linha vermelha') && hasAny('fluxo', 'linha amarela', 'grafico amarelo')) {
            return "A <strong>Relação entre Fluxo e FEM</strong> é de derivada matemática! Isto cria um desfasamento de 90° no gráfico:<ul><li>Quando o Fluxo (amarelo) cruza o zero (cresce ou decresce mais depressa), a FEM (vermelha) atinge as pontas de amplitude <strong>máxima</strong>.</li><li>Quando o Fluxo atinge o topo/fundo da sua onda, a sua variação congela por um milissegundo, logo a FEM cai para <strong>zêro</strong>!</li></ul>";
        }

        // Relational Analytics: FEM vs Area
        if (hasAny('relacao', 'ligacao', 'efeito') && hasAny('fem', 'eletromotriz', 'grafico vermelho', 'linha vermelha') && hasAny('area', 'tamanho')) {
            return "A <strong>Relação entre FEM e Área</strong> é de proporcionalidade direta (mantendo o resto constante). Ao aumentares a Área da espira no slider, englobas muito mais linhas de campo magnético. Consequentemente, o Fluxo Máximo cresce, o que obriga a taxa de variação desse fluxo (ΔΦ/Δt) a ser muito maior, gerando picos de <strong>Força Eletromotriz muito mais altos</strong>!";
        }

        // Relational Analytics: Fluxo vs Numero Espiras
        if (hasAny('relacao', 'ligacao') && hasAny('fluxo', 'linha amarela') && hasAny('numero', 'voltas', 'espiras', 'n')) {
            return "A <strong>Relação entre Fluxo e Número de Espiras (N)</strong> é multiplicativa de acordo com a geometria da Bobina. O fluxo magnético total englobado pela Bobina é simplesmente a soma do fluxo que passa em cada volta: <strong>Φ<sub>total</sub> = N · Φ<sub>espiras</sub></strong>. Se dobrares o N, a onda amarela do gráfico fica com o dobro da altura mínima/máxima.";
        }

        // Relational Analytics: FEM vs Numero Espiras
        if (hasAny('relacao', 'ligacao', 'depende') && hasAny('fem', 'eletromotriz', 'grafico vermelho') && hasAny('numero', 'voltas', 'espiras', 'n')) {
            return "A <strong>Relação entre a FEM e o Número de Espiras (N)</strong> baseia-se na Lei de Faraday em série. Como cada volta de fio gera a sua própria voltagem induzida, a voltagem total numa Bobina acumula-se: <strong>|ε| = N · |ΔΦ/Δt|</strong>. Isto implica que uma bobina densa (maior N) é muito mais reativa às alterações de campo do que uma mera espira simples.";
        }

        // Originais
        if (hasAny('aumentar', 'subir', 'maior', 'acrescentar') && hasAny('area', 'tamanho') && hasAny('grafico', 'onda', 'pico', 'vermelha', 'amarela', 'fem', 'fluxo')) {
            return "Ao <strong>aumentar a área</strong> da espira no slider, o fluxo magnético englobado será geometricamente maior (a onda amarela cresce em amplitude). Consequentemente, a taxa de variação desse fluxo (ΔΦ/Δt) também será maior para a mesma velocidade de rotação, o que fará com que o pico da <strong>força eletromotriz (onda vermelha) atinja valores visivelmente mais altos no gráfico</strong>!";
        }
        if (hasAny('aumentar', 'subir', 'maior', 'rapido', 'acelerar') && hasAny('velocidade', 'omega') && hasAny('grafico', 'onda', 'pico', 'vermelha', 'amarela', 'fem', 'fluxo')) {
            return "Ao <strong>aumentar a velocidade angular (ω)</strong>, a espira roda mais rápido. O fluxo (onda amarela) atinge os mesmos valores máximos, mas fá-lo em muito menos tempo (as ondas ficam mais 'espremidas' na horizontal). Esta variação temporal muito mais rápida (um enorme ΔΦ/Δt) gera <strong>picos de voltagem (onda vermelha) muito maiores no gráfico</strong>!";
        }
        if (hasAny('diminuir', 'reduzir', 'menor', 'devagar') && hasAny('velocidade', 'omega') && hasAny('grafico', 'onda', 'pico', 'vermelha', 'amarela', 'fem', 'fluxo')) {
            return "Ao <strong>diminuir a velocidade angular (ω)</strong>, a espira roda lentamente. O fluxo tem tempo de sobra para variar de 0 ao máximo, logo a taxa de variação (ΔΦ/Δt) é pequena. O resultado no gráfico é uma onda amarela larga e uma <strong>onda vermelha (FEM) muito baixinha</strong>.";
        }

        // ── 2. Consciência da Interface (UI vs Simulação) ──
        if (hasAny('bobina', 'espiras') && hasAny('diferenca', 'espira', 'que e', 'comparar')) {
            return "No menu <strong>'Elemento Magnético'</strong> podes trocar entre <strong>Espira (1 volta)</strong> e <strong>Bobina</strong>.<br/>Na nossa simulação, ao escolheres 'Bobina', o desenho 2D fica visivelmente mais espesso para representar o enrolamento e ganhas acesso ao slider 'N.º de Espiras (N)'. Fisicamente, o fluxo total e a FEM multiplicam-se por esse `N` (ex: 5 voltas = FEM 5 vezes maior que uma espira simples).";
        }
        if (hasAny('uniforme', 'iman') && hasAny('diferenca', 'campo', 'que e', 'escolher', 'mudar')) {
            return "No menu <strong>'Tipo de Campo'</strong>, tens duas opções físicas distintas:<br/>1. <strong>Campo Uniforme:</strong> Linhas paralelas e constantes em todo o espaço (geradas mecanicamente). Para induzir corrente aqui, tens que usar o espaço rodando a espira (variar o ângulo α).<br/>2. <strong>Íman em Barra:</strong> O campo é forte perto dos polos e enfraquece ao longe. O movimento ideal aqui é <strong>arrastar o íman horizontalmente</strong> (translação) para variar o campo B que atravessa a espira estacionária.";
        }
        if (hasAny('play', 'pause', 'rodar sozinho', 'animacao', 'botao do meio', 'arrancar')) {
            return "O <strong>botão Play (▶)</strong> na barra inferior tira o trabalho das tuas mãos e faz a espira rodar autonomamente, usando a velocidade definida no slider 'Velocidade Angular (ω)'. Podes pausar a qualquer momento clicando no mesmo botão ou usando a barra de <strong>Espaço</strong> como atalho!";
        }
        if (hasAny('reiniciar', 'reset', 'voltar ao inicio')) {
            return "O botão <strong>Reiniciar (↺)</strong> para imediatamente o motor da animação, roda fisicamente a espira de volta para a inclinação inicial de 0° e apaga definitivamente todos os traços do gráfico elétrico. Podes usar a tecla <strong>R</strong> para este atalho.";
        }
        if (hasAny('limpar', 'limpa', 'apagar grafico')) {
            return "O pequeno botão <strong>Limpar</strong> no interior do painel do gráfico serve apenas para varrer o histórico visual (as curvas amarela e vermelha) do ecrã, <strong>sem interromper</strong> o movimento atual da espira. Útil para quando acabas de mudar uma variável abruptamente!";
        }

        // ── 3. Física Base Teórica ──
        // Faraday
        if (hasAny('faraday', 'lei de faraday')) {
            return "A <strong>Lei de Faraday</strong> afirma que a força eletromotriz (ε) induzida numa espira é igual, em módulo, à rapidez com que ocorre a variação do fluxo magnético (ΔΦ/Δt).<br/><br/>No gráfico, podes ver isto claramente: a linha vermelha (|ε|) é máxima quando o fluxo (linha amarela) cruza o eixo do tempo (onde a taxa de variação é maior).";
        }

        // Lenz / Sentido da corrente
        if (hasAny('lenz', 'corrente', 'sentido', 'direcao da corrente')) {
            return "A <strong>Lei de Lenz</strong> dita que o sentido da corrente induzida é tal que o seu próprio campo magnético se opõe à variação do fluxo que a originou.<ul><li>Se o fluxo aumenta, a corrente cria um campo oposto.</li><li>Se o fluxo diminui, a corrente cria um campo no mesmo sentido para repor o fluxo perdido.</li></ul>Observa os símbolos ⊙ e ⊗ na ponta da geometria: eles invertem de sentido no exato milissegundo em que o fluxo atinge um máximo ou mínimo!";
        }

        // Flux (Fluxo Magnético)
        if (hasAny('fluxo', 'phi', 'formula do fluxo', 'que e o fluxo')) {
            return "O <strong>Fluxo Magnético (Φ)</strong> mede o número de linhas de campo que atravessam a espira. Calcula-se como <strong>Φ = B · A · cos(α)</strong>.<br/><br/>- O fluxo é <strong>MÁXIMO</strong> quando a espira está de 'frente' para as linhas (α = 0° ou 180°).<br/>- O fluxo é <strong>ZERO</strong> quando a espira está de 'perfil' (α = 90° ou 270°), pois as linhas deslizam paralelamente ao cobre sem o atravessar.";
        }

        // Emf / Força eletromotriz
        if (hasAny('fem', 'eletromotriz', 'grafico vermelho', 'linha vermelha', 'eps', 'voltagem', 'tensao')) {
            return "A <strong>Força Eletromotriz (ε)</strong> é a tensão gerada pela variação do fluxo magnético. Presta atenção ao gráfico: quando o fluxo está no topo exato da montanha (máximo local), a FEM nesse milissegundo é <strong>nula</strong>! A derivada (taxa de variação) no cume da montanha é sempre zero antes do fluxo começar a descer.";
        }

        // Angle / Versor Normal
        if (hasAny('angulo', 'alpha', 'alfa', 'normal', 'versor')) {
            return "O ângulo <strong>α (alfa)</strong> é o ângulo entre as linhas de campo (B) e o <strong>versor normal (n̂)</strong>, que é estritamente perpendicular à geometria da espira. Se reparares na simulação, há um pequeno vetor rosa n̂. O arco amarelo desenha e mede exatamente este ângulo!";
        }

        // Magnet
        if (hasAny('iman', 'barra', 'afastar', 'aproximar')) {
            return "Ao moveres o íman, o campo magnético (B) na zona da espira varia geograficamente (muito forte perto, fraco ao longe). O rápido deslizar do íman com o teu rato causa uma enorme variação temporal (ΔΦ/Δt), gerando indução eletromagnética imediata! Experimenta arrastá-lo ferozmente vs. arrastá-lo suavemente para veres a diferença na voltagem lida no painel.";
        }

        // Variables / Sliders Genérico
        if (hasAny('aumentar', 'diminuir', 'mexer') && hasAny('area', 'campo', 'espiras', 'velocidade', 'intensidade', 'omega', 'slider')) {
            return "No painel da direita, os sliders controlam os corações matemáticos das fórmulas físicas. Qualquer alteração nestes que torne a variação do fluxo num segundo (ΔΦ/Δt) maior aumentará fortemente a FEM. Testa empurrar o slider da <strong>Área (A)</strong> para a direita, ou meter a <strong>Velocidade Angular (ω)</strong> no máximo e limpa o gráfico para veres as ondas gigantes!";
        }

        // Fallback
        return "Consegues formular melhor a tua ideia? Podes perguntar coisas como: o que acontece ao <strong>gráfico se aumentares a área</strong>, as diferenças visuais entre <strong>Espira e Bobina</strong>, para que serve o botão de <strong>Limpar o gráfico</strong>, como usar o botão <strong>Play</strong>, ou até aprofundar conceitos como a <strong>Lei de Faraday</strong> ou a diferença angular de 90° para a FEM.";
    }
});
