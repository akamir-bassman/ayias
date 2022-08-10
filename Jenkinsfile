pipeline {
    agent any
    environment {
        BRANCH = "$env.BRANCH_NAME"
        BUILD_CONF = credentials("jenkins-conf")
        APPS = "metaserver,metaclient"
    }
    stages {
        stage("Boot"){
            steps{
                sh "cp $BUILD_CONF .jenkins.conf"
                load ".jenkins.conf"
                discordSend description: "Build Start - $env.JOB_NAME $env.BUILD_NUMBER", link: env.BUILD_URL, result: currentBuild.currentResult, title: env.JOB_NAME, webhookURL: env.DISCORD_WEBHOOK
            }
        }
        stage("Prepare"){
            parallel{
                stage("Prepare Build"){
                    steps{
                        sh "ssh -v -o StrictHostKeyChecking=no $MS_USER@$MS_HOST -p $MS_PORT \"mkdir -p $REPO_NAME/$BRANCH/node_modules && touch $REPO_NAME/$BRANCH/dummy.js\""
                        sh "ssh -v -p $MS_PORT $MS_USER@$MS_HOST \"cd $REPO_NAME/$BRANCH && find . -maxdepth 1 ! -path . ! \\( -name node_modules -or -name package-lock.json -or -name dist -or -name .git \\) -print0 | xargs -0 sudo rm -r\""
                        sh "scp -v -P $MS_PORT -rp * $MS_USER@$MS_HOST:~/$REPO_NAME/$BRANCH/"
                        script {
                            APPS.tokenize(",").each { app -> 
                                withCredentials([file(credentialsId: "$REPO_NAME-$app-env-$BRANCH", variable: "ENV")]) {
                                    sh "scp -v -P $MS_PORT $ENV $MS_USER@$MS_HOST:~/$REPO_NAME/$BRANCH/apps/$app/.env"        
                                }
                            }
                        }
                    }
                }
            }
        }
        stage("Build"){
            steps {
                sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"cd $REPO_NAME/$BRANCH && sudo npm install --legacy-peer-deps\""
                sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"cd $REPO_NAME/$BRANCH && sudo nx affected:build --all --parallel=1\""
            }
        }
        stage("Dockerize"){
            steps {
                script {
                    def dockerizes = [:]
                    APPS.tokenize(",").each { app -> 
                        dockerizes[app] = {
                            sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"cd $REPO_NAME/$BRANCH && sudo find ./apps/$app -name *.env -exec cp {} ./dist/apps/$app \\;\""
                            sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"cd $REPO_NAME/$BRANCH && sudo find ./apps/$app -name Dockerfile -exec cp {} ./dist/apps/$app \\;\""
                            sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"cd $REPO_NAME/$BRANCH/dist/apps/$app && sudo docker build . -t ${REPO_NAME}_$app\""
                            sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"docker save ${REPO_NAME}-$app-$BRANCH > ~/$app-${BRANCH}.tar\""
                        }
                    }
                }
            }
        }
        stage("Distribute"){
            parallel{
                stage("Distribute Metaserver"){
                    steps{    
                        sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"scp -v -o StrictHostKeyChecking=no -P $METASERVER_PORT ~/$METASERVER_APP-${BRANCH}.tar $METASERVER_USER@$METASERVER_HOST:~/$METASERVER_APP-${BRANCH}.tar\""
                        sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"scp -v -P $METASERVER_PORT ~/$REPO_NAME/$BRANCH/infra/main/docker-compose.yml $METASERVER_USER@$METASERVER_HOST:~/$REPO_NAME/docker-compose.yml\""
                        sh "ssh -v -o StrictHostKeyChecking=no $METASERVER_USER@$METASERVER_HOST -p $METASERVER_PORT \"docker load < $METASERVER_APP-${BRANCH}.tar\""
                    }
                }
                stage("Distribute Metaclient"){
                    steps{    
                        sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"scp -v -o StrictHostKeyChecking=no -P $METACLIENT_PORT ~/$METACLIENT_APP-${BRANCH}.tar $METACLIENT_USER@$METACLIENT_HOST:~/$METACLIENT_APP-${BRANCH}.tar\""
                        sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"scp -v -P $METACLIENT_PORT ~/$REPO_NAME/$BRANCH/infra/web/docker-compose.yml $METACLIENT_USER@$METACLIENT_HOST:~/$REPO_NAME/docker-compose.yml\""
                        sh "ssh -v -o StrictHostKeyChecking=no $METACLIENT_USER@$METACLIENT_HOST -p $METACLIENT_PORT \"docker load < $METACLIENT_APP-${BRANCH}.tar\""
                    }
                }
            }
        }
        stage("Deploy"){
            parallel{
                stage("Deploy Metaserver"){
                    steps{
                        sh "ssh -v -o StrictHostKeyChecking=no $METASERVER_USER@$METASERVER_HOST -p $METASERVER_PORT \"cd ~/$REPO_NAME && docker service update --force ${REPO_NAME}_${METACLEINT_APP} && docker system prune -a -f\""
                    }
                }
                stage("Deploy Metaclient"){
                    steps{
                        // sh 'ssh -v -o StrictHostKeyChecking=no ${FRONTEND_USER}@${FRONTEND_HOST} -p ${FRONTEND_PORT} "docker stack rm ${REPO_NAME} && docker stack deploy --compose-file docker-compose.yml ${REPO_NAME} && docker system prune -a -f"'                        
                        sh "ssh -v -o StrictHostKeyChecking=no $METACLIENT_USER@$METACLIENT_HOST -p $METACLIENT_PORT \"cd ~/$REPO_NAME && docker service update --force ${REPO_NAME}_${METACLEINT_APP} && docker system prune -a -f\""
                    }
                }
            }
        }
        stage("Cleanup"){
            steps {
                sh "ssh -v $MS_USER@$MS_HOST -p $MS_PORT \"cd $REPO_NAME/$BRANCH && sudo npm run docker:clean --url=$REG_URL/$REPO_NAME --branch=$BRANCH\""
            }
        }
    }
    post {
        failure {
            discordSend description: "Build Failed - $env.JOB_NAME $env.BUILD_NUMBER", link: env.BUILD_URL, result: currentBuild.currentResult, title: env.JOB_NAME, webhookURL: env.DISCORD_WEBHOOK
        }
        success {
            discordSend description: "Build Succeed - $env.JOB_NAME $env.BUILD_NUMBER", link: env.BUILD_URL, result: currentBuild.currentResult, title: env.JOB_NAME, webhookURL: env.DISCORD_WEBHOOK
        }
    }
}