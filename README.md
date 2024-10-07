chạy project: npm run start:dev (sử dụng file .env)

build project: npm run build

build docker: docker build -t kientrucphanmem/server:tag . (tag là version)

zip docker image: docker save -o kientrucphanmem_server_tag.tar kientrucphanmem/server:tag (tag là version)

send zipped docker image to server: scp ./kientrucphanmem_server_tag.tar host:~/kientrucphanmem/server/docker-images