# ifndef TAG
# $(error The TAG variable is missing.)
# endif
 
# ifndef ENV
# $(error The ENV variable is missing.)
# endif
 
# ifeq ($(filter $(ENV),test dev stag prod),)
# $(error The ENV variable is invalid.)
# endif

ifeq (,$(filter $(ENV),test dev))
COMPOSE_FILE_PATH := -f docker-compose.yml
endif

build:
	$(info Make: Building images.)
	@make -s stop
	docker-compose build

build-fresh:
	$(info Make: Building images. Without cache.)
	@make -s stop
	docker-compose build --no-cache

build-app:
	$(info Make: Building APP image.)
	@make -s stop
	docker-compose build --no-cache app

# build-api:
# 	$(info Make: Building API image.)
# 	@make -s stop
# 	docker-compose build --no-cache api 

# pull:
# 	$(info Make: Pulling images from the registry.)
# 	@make -s stop
# 	docker-compose pull

# push:
# 	$(info Make: Pushing images to the registry.)
# 	@make -s stop
# 	docker-compose push

start:
	$(info Make: Starting containers. Don't forget to pull the latest images.)
	docker-compose $(COMPOSE_FILE_PATH) up

stop:
	$(info Make: Stopping containers.)
	docker-compose stop

remove-volumes:
	$(info Make: Stopping containers and removing volumes.)
	docker-compose down -v

watch:
	$(info Make: Starting frontend watcher process.)
	(npm i && npm start)

prod:
	$(info Make: Compiling frontend assets in production mode.)
	(npm i && npm build)

restart:
	$(info Make: Restarting containers.)
	@make -s stop
	@make -s start

logs:
	docker-compose logs -t -f --tail 10 app

# .PHONY: build build-fresh build-app start stop remove-volumes watch prod restart logs