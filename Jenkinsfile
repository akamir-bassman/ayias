pipeline {
    agent any
    environment {
        BUILD_CONF = credentials('akamir-build-conf')
        METASERVER_ENV = credentials('akamir-metaserver-env')
        METACLIENT_ENV = credentials('akamir-metaclient-env')
    }
    stages {
        stage("Prepare"){
            steps{
                sh 'cp ${BUILD_CONF} .jenkins.conf'
                load '.jenkins.conf'
                discordSend description: "Build Start - ${env.JOB_NAME} ${env.BUILD_NUMBER}", link: env.BUILD_URL, result: currentBuild.currentResult, title: env.JOB_NAME, webhookURL: env.DISCORD_WEBHOOK
                sh 'ssh -v -o StrictHostKeyChecking=no ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "mkdir -p ${PROJECT_NAME}/${REPO_NAME}/node_modules && touch ${PROJECT_NAME}/${REPO_NAME}/dummy.js"'
                sh 'ssh -v -p ${PROD_BUILD_PORT} ${PROD_BUILD_USER}@${PROD_BUILD_HOST} "cd ${PROJECT_NAME}/${REPO_NAME} && find . -maxdepth 1 ! -path . ! \\( -name node_modules -or -name package-lock.json -or -name dist \\) -print0 | xargs -0 sudo rm -r"'
                sh 'scp -v -P ${PROD_BUILD_PORT} -rp * ${PROD_BUILD_USER}@${PROD_BUILD_HOST}:~/${PROJECT_NAME}/${REPO_NAME}/'
                sh 'scp -v -P ${PROD_BUILD_PORT} ${METASERVER_ENV} ${PROD_BUILD_USER}@${PROD_BUILD_HOST}:~/${PROJECT_NAME}/${REPO_NAME}/apps/${METASERVER_APP}/.production.env'
                sh 'scp -v -P ${PROD_BUILD_PORT} ${METACLIENT_ENV} ${PROD_BUILD_USER}@${PROD_BUILD_HOST}:~/${PROJECT_NAME}/${REPO_NAME}/apps/${METACLIENT_APP}/.env'
            }        
        }
        stage("Build"){
            steps{
                sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "cd ${PROJECT_NAME}/${REPO_NAME} && npm i --legacy-peer-deps"'
                sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "cd ${PROJECT_NAME}/${REPO_NAME} && sudo nx affected:build --all --parallel=5"'
                sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "cd ${PROJECT_NAME}/${REPO_NAME} && sudo cp apps/${METASERVER_APP}/.production.env dist/apps/${METASERVER_APP}/.production.env"'
                sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "cd ${PROJECT_NAME}/${REPO_NAME} && sudo cp apps/${METACLIENT_APP}/.env dist/apps/${METACLIENT_APP}/.env"'
                sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "cd ${PROJECT_NAME}/${REPO_NAME}/infra/${PROJECT_NAME} && sudo docker system prune -a -f && sudo docker-compose -f docker-compose.yml build --parallel"'
            }
        }
        // stage("Test"){
        // }
        stage("Save"){
            parallel{
                stage("Save Metaserver"){
                    steps{
                        sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "docker save ${REPO_NAME}_${METASERVER_APP} > ~/${PROJECT_NAME}/${METASERVER_APP}.tar"'
                    }
                }
                stage("Save Metaclient"){
                    steps{
                        sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "docker save ${REPO_NAME}_${METACLIENT_APP} > ~/${PROJECT_NAME}/${METACLIENT_APP}.tar"'
                    }
                }
            }
        }
        stage("Distribute"){
                stage("Distribute Metaserver"){
                    steps{    
                        sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "scp -v -o StrictHostKeyChecking=no -P ${BACKEND_PORT} ~/${PROJECT_NAME}/${METASERVER_APP}.tar ${BACKEND_USER}@${BACKEND_HOST}:~/${METASERVER_APP}.tar"'
                        sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "scp -v -P ${BACKEND_PORT} ~/${PROJECT_NAME}/${REPO_NAME}/infra/main/docker-compose.yml ${BACKEND_USER}@${BACKEND_HOST}:~/${PROJECT_NAME}/docker-compose.yml"'
                        sh 'ssh -v -o StrictHostKeyChecking=no ${BACKEND_USER}@${BACKEND_HOST} -p ${BACKEND_PORT} "docker load < ${METASERVER_APP}.tar"'
                    }
                }
                stage("Distribute Metaclient"){
                    steps{    
                        sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "scp -v -o StrictHostKeyChecking=no -P ${FRONTEND_PORT} ~/${PROJECT_NAME}/${METACLIENT_APP}.tar ${FRONTEND_USER}@${FRONTEND_HOST}:~/${METACLIENT_APP}.tar"'
                        sh 'ssh -v ${PROD_BUILD_USER}@${PROD_BUILD_HOST} -p ${PROD_BUILD_PORT} "scp -v -P ${FRONTEND_PORT} ~/${PROJECT_NAME}/${REPO_NAME}/infra/web/docker-compose.yml ${FRONTEND_USER}@${FRONTEND_HOST}:~/${PROJECT_NAME}/docker-compose.yml"'
                        sh 'ssh -v -o StrictHostKeyChecking=no ${FRONTEND_USER}@${FRONTEND_HOST} -p ${FRONTEND_PORT} "docker load < ${METACLIENT_APP}.tar"'
                    }
                }
            }
        }
        stage("Deploy"){
            parallel{
                stage("Deploy Backend"){
                    steps{
                        sh 'ssh -v -o StrictHostKeyChecking=no ${BACKEND_USER}@${BACKEND_HOST} -p ${BACKEND_PORT} "cd ~/${PROJECT_NAME} && docker service update --force ${REPO_NAME}_${BACKEND_APP} && docker system prune -a -f"'
                    }
                }
                stage("Deploy Frontend"){
                    steps{
                        // sh 'ssh -v -o StrictHostKeyChecking=no ${FRONTEND_USER}@${FRONTEND_HOST} -p ${FRONTEND_PORT} "docker stack rm ${REPO_NAME} && docker stack deploy --compose-file docker-compose.yml ${REPO_NAME} && docker system prune -a -f"'                        
                        sh 'ssh -v -o StrictHostKeyChecking=no ${FRONTEND_USER}@${FRONTEND_HOST} -p ${FRONTEND_PORT} "cd ~/${PROJECT_NAME} && docker service update --force ${REPO_NAME}_${FRONTEND_APP} && docker system prune -a -f"'
                    }
                }
            }
        }
    }
    post {
        failure {
            discordSend description: "Build Failed - ${env.JOB_NAME} ${env.BUILD_NUMBER}", link: env.BUILD_URL, result: currentBuild.currentResult, title: env.JOB_NAME, webhookURL: env.DISCORD_WEBHOOK
        }
        success {
            discordSend description: "Build Succeed - ${env.JOB_NAME} ${env.BUILD_NUMBER}", link: env.BUILD_URL, result: currentBuild.currentResult, title: env.JOB_NAME, webhookURL: env.DISCORD_WEBHOOK
        }
    }
}