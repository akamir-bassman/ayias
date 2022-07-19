pipeline {
    agent any
    environment {
        BUILD_CONF = credentials('akamir-build-conf')
        BACKEND_ENV_DEV = credentials('akamir-backend-env-dev')
        BACKEND_ENV = credentials('akamir-backend-env')
        FRONTEND_ENV_DEV = credentials('akamir-frontend-env-dev')
        FRONTEND_ENV = credentials('akamir-frontend-env')
    }
    stages {
        stage("Prepare"){
            steps{
                sh 'cp ${BUILD_CONF} .jenkins.conf'
                load '.jenkins.conf'
                discordSend description: "Build Start - ${env.JOB_NAME} ${env.BUILD_NUMBER}", link: env.BUILD_URL, result: currentBuild.currentResult, title: env.JOB_NAME, webhookURL: env.DISCORD_WEBHOOK
                sh 'ssh -v -o StrictHostKeyChecking=no ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "cd ${PROJECT_NAME}/${REPO_NAME} && find . -maxdepth 1 ! -path . ! \\( -name node_modules -or -name package-lock.json -or -name dist \\) -print0 | xargs -0 sudo rm -r"'
                sh 'scp -v -P ${TEST_PORT} -rp * ${TEST_USER}@${TEST_HOST}:~/${PROJECT_NAME}/${REPO_NAME}/'
                sh 'scp -v -P ${TEST_PORT} ${BACKEND_ENV} ${TEST_USER}@${TEST_HOST}:~/${PROJECT_NAME}/${REPO_NAME}/apps/${BACKEND_APP}/.production.env'
                sh 'scp -v -P ${TEST_PORT} ${FRONTEND_ENV} ${TEST_USER}@${TEST_HOST}:~/${PROJECT_NAME}/${REPO_NAME}/apps/${FRONTEND_APP}/.env'
            }        
        }
        stage("Build"){
            steps{
                sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "cd ${PROJECT_NAME}/${REPO_NAME} && npm i --legacy-peer-deps"'
                sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "cd ${PROJECT_NAME}/${REPO_NAME} && sudo nx affected:build --all --parallel=5"'
                sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "cd ${PROJECT_NAME}/${REPO_NAME} && sudo cp apps/${BACKEND_APP}/.production.env dist/apps/${BACKEND_APP}/.production.env"'
                sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "cd ${PROJECT_NAME}/${REPO_NAME} && sudo cp apps/${FRONTEND_APP}/.env dist/apps/${FRONTEND_APP}/.env"'
                sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "cd ${PROJECT_NAME}/${REPO_NAME}/infra/${PROJECT_NAME} && sudo docker system prune -a -f && sudo docker-compose -f docker-compose.yml build --parallel"'
            }
        }
        // stage("Test"){
        // }
        stage("Save"){
            parallel{
                stage("Save Backend"){
                    steps{
                        sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "docker save ${REPO_NAME}_${BACKEND_APP} > ~/${PROJECT_NAME}/${BACKEND_APP}.tar"'
                    }
                }
                stage("Save Frontend"){
                    steps{
                        sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "docker save ${REPO_NAME}_${FRONTEND_APP} > ~/${PROJECT_NAME}/${FRONTEND_APP}.tar"'
                    }
                }
            }
        }
        stage("Distribute"){
            parallel{
                stage("Distribute Main"){
                    steps{    
                        sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "scp -v -o StrictHostKeyChecking=no -P ${BACKEND_PORT} ~/${PROJECT_NAME}/${BACKEND_APP}.tar ${BACKEND_USER}@${BACKEND_INNER_HOST}:~/${BACKEND_APP}.tar"'
                        sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "scp -v -P ${BACKEND_PORT} ~/${PROJECT_NAME}/${REPO_NAME}/infra/main/docker-compose.yml ${BACKEND_USER}@${BACKEND_INNER_HOST}:~/${PROJECT_NAME}/docker-compose.yml"'
                        sh 'ssh -v -o StrictHostKeyChecking=no ${BACKEND_USER}@${BACKEND_HOST} -p ${BACKEND_PORT} "docker load < ${BACKEND_APP}.tar"'
                    }
                }
                stage("Distribute Batch"){
                    steps{    
                        sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "scp -v -o StrictHostKeyChecking=no -P ${BATCH_PORT} ~/${PROJECT_NAME}/${BACKEND_APP}.tar ${BATCH_USER}@${BATCH_INNER_HOST}:~/${BACKEND_APP}.tar"'
                        sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "scp -v -P ${BATCH_PORT} ~/${PROJECT_NAME}/${REPO_NAME}/infra/batch/docker-compose.yml ${BATCH_USER}@${BATCH_INNER_HOST}:~/${PROJECT_NAME}/docker-compose.yml"'
                        sh 'ssh -v -o StrictHostKeyChecking=no ${BATCH_USER}@${BATCH_HOST} -p ${BATCH_PORT} "docker load < ${BACKEND_APP}.tar"'
                    }
                }
                stage("Distribute Frontend"){
                    steps{
                        sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "scp -v -o StrictHostKeyChecking=no -P ${FRONTEND_PORT} ~/${PROJECT_NAME}/${FRONTEND_APP}.tar ${FRONTEND_USER}@${FRONTEND_INNER_HOST}:~/${FRONTEND_APP}.tar"'
                        sh 'ssh -v ${TEST_USER}@${TEST_HOST} -p ${TEST_PORT} "scp -v -P ${FRONTEND_PORT} ~/${PROJECT_NAME}/${REPO_NAME}/infra/web/docker-compose.yml ${FRONTEND_USER}@${FRONTEND_INNER_HOST}:~/${PROJECT_NAME}/docker-compose.yml"'
                        sh 'ssh -v -o StrictHostKeyChecking=no ${FRONTEND_USER}@${FRONTEND_HOST} -p ${FRONTEND_PORT} "docker load < ${FRONTEND_APP}.tar"'
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
                stage("Deploy Batch"){
                    steps{
                        sh 'ssh -v -o StrictHostKeyChecking=no ${BATCH_USER}@${BATCH_HOST} -p ${BATCH_PORT} "cd ~/${PROJECT_NAME} && docker-compose up --force-recreate -d && docker system prune -a -f"'
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