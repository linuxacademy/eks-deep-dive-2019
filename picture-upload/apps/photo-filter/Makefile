IMAGE := photo-filter
VERSION := $(shell git rev-parse HEAD)
BUILD_DATE := $(shell date -R)
VCS_URL := $(shell basename `git rev-parse --show-toplevel`)
VCS_REF := $(shell git log -1 --pretty=%h)

build:
	docker build --rm -t ${IMAGE} --build-arg VERSION="${VERSION}" \
	--build-arg BUILD_DATE="${BUILD_DATE}" \
	--build-arg VCS_URL="${VCS_URL}" \
	--build-arg VCS_REF="${VCS_REF}" \
	--build-arg NAME="${NAME}" \
	--build-arg VENDOR="${VENDOR}" .

run:
	docker run --rm -p 3002:3002 --name photo-filter ${IMAGE}

tag:
	docker tag ${IMAGE}:latest ${ECR_REPO_PREFIX}/${IMAGE}:latest

push:
	docker push ${ECR_REPO_PREFIX}/${IMAGE}:latest

clean:
	docker images -q -f "dangling=true" | xargs -I {} docker rmi {}
	docker volume ls -q -f "dangling=true" | xargs -I {} docker volume rm {}

inspect:
	docker inspect --format='{{range $$k, $$v := .Config.Labels}}{{$$k}}={{$$v}}{{println}}{{end}}' ${IMAGE}

print:
	@echo VERSION=${VERSION}
	@echo BUILD_DATE=${BUILD_DATE}
	@echo VCS_URL=${VCS_URL}
	@echo VCS_REF=${VCS_REF}
	@echo IMAGE=${IMAGE}