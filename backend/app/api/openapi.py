OPENAPI_TAGS = [
    {
        "name": "status",
        "description": (
            "Comprueba la disponibilidad de OpenAI, Ollama y Chroma, y muestra "
            "los modelos configurados sin exponer credenciales."
        ),
    },
    {
        "name": "documents",
        "description": (
            "Gestiona la entrada al pipeline: crea documentos desde texto, TXT o PDF, "
            "extrae su contenido, genera chunks y permite consultar o borrar los datos locales."
        ),
    },
    {
        "name": "indexing",
        "description": (
            "Convierte chunks en embeddings y los almacena en colecciones de Chroma. "
            "También administra los manifiestos que evitan mezclar configuraciones incompatibles."
        ),
    },
    {
        "name": "query",
        "description": (
            "Ejecuta la parte consultable de RAG: vectoriza la pregunta, recupera los chunks "
            "más cercanos, construye el contexto, llama al LLM y valida las citas devueltas."
        ),
    },
    {
        "name": "learning",
        "description": (
            "Ofrece experimentos educativos aislados, como comparar embeddings y distancias, "
            "sin crear documentos ni modificar los índices persistentes del laboratorio."
        ),
    },
]
