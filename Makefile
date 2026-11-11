.PHONY: install backend frontend test build

install:
	python3.12 -m venv .venv
	.venv/bin/python -m pip install --upgrade pip
	.venv/bin/python -m pip install -e './backend[test]'
	cd frontend && npm ci

backend:
	.venv/bin/python -m uvicorn app.main:app --app-dir backend --reload --port 8000

frontend:
	cd frontend && npm run dev

test:
	.venv/bin/python -m pytest backend/tests
	cd frontend && npm test

build:
	cd frontend && npm run build
