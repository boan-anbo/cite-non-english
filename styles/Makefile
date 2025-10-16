# Phony targets ensure commands always run
.PHONY: final final-flat dev diffs check clean help

final: ## Build CSL variants (grouped per family by default)
	@uv run style-variant-builder

final-flat: ## Build CSL variants without grouping (flat output directory)
	@uv run style-variant-builder --flat-output

dev: ## Build unpruned CSL variants for development
	@uv run style-variant-builder --development

diffs: ## Regenerate diff patches from development
	@uv run style-variant-builder --diffs

check: ## Build development styles and generate diffs to verify patches
	@$(MAKE) dev
	@$(MAKE) diffs

clean: ## Remove output directories
	@rm -rf output development

# Help target: Lists targets and their inline comments in a neatly aligned, coloured format.
help:
	@echo "Usage: make [target]\n"
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk -F '##' '{printf "\033[1;32m%-15s\033[0m - %s\n", $$1, $$2}'
