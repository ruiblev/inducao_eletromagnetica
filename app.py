import streamlit as st
import streamlit.components.v1 as components
import os

# Configuração da página Streamlit
st.set_page_config(
    page_title="Simulador de Indução Eletromagnética",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Título e descrição (opcional, já que o HTML tem o seu próprio header)
# st.title("🔬 Simulador de Indução Eletromagnética")

def load_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

# Caminho base do projeto
base_path = os.path.dirname(__file__)

# Carregar o conteúdo do HTML principal
# Nota: Streamlit Components renderiza em um iframe. 
# Precisamos garantir que os caminhos para CSS e JS funcionem ou injetar diretamente.
html_content = load_file(os.path.join(base_path, "index.html"))
css_content = load_file(os.path.join(base_path, "style.css"))

# Carregar scripts JS
js_files = ["simulation.js", "graph.js", "controls.js", "chatbot.js"]
scripts_content = ""
for js_file in js_files:
    content = load_file(os.path.join(base_path, "js", js_file))
    scripts_content += f"\n<script>\n{content}\n</script>\n"

# Injetar CSS e JS diretamente no HTML para que tudo funcione num único bloco (iframe amigável)
html_integrated = html_content.replace(
    '<link rel="stylesheet" href="style.css">',
    f'<style>{css_content}</style>'
)

# Remover as tags <script src="..."> originais
import re
html_integrated = re.sub(r'<script src="js/.*?"></script>', '', html_integrated)

# Adicionar o conteúdo dos scripts no final do body
html_integrated = html_integrated.replace('</body>', f'{scripts_content}</body>')

# Renderizar a aplicação
components.html(html_integrated, height=900, scrolling=True)

# Rodapé informativo
st.markdown("---")
st.caption("Desenvolvido para o currículo de Física 11.º ano. Versão Streamlit.")
