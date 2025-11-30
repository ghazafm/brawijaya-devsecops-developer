def COLOR_MAP = [
    'SUCCESS': 'good',
    'FAILURE': 'danger'
]

pipeline {
    agent none
    environment {
        PATH = "/home/jenkins/.local/bin:/home/jenkins/codeql:${env.PATH}"
    }
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            agent { label 'builtin' }
            steps {
                echo 'Checking out source on builtin node'
                checkout scm
                script {
                    def branch = sh(
                        script: """
                            git rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD
                        """,
                        returnStdout: true
                    ).trim()

                    env.EFFECTIVE_BRANCH = branch
                    echo "Detected branch: ${env.EFFECTIVE_BRANCH}"
                }
            }

        }

        stage('SAST') {
            agent { label 'builtin' }
            stages {
                stage('Semgrep') {
                    steps {
                        echo 'Running Semgrep (if installed)'
                        sh """
                            if command -v semgrep >/dev/null 2>&1; then
                                semgrep --config auto || true
                            else
                                echo 'semgrep not found, skipping SAST semgrep step'
                            fi
                        """
                    }
                }

                stage('CodeQL') {
                    stages {
                        stage('Create CodeQL Databases') {
                            steps {
                                echo 'Creating CodeQL databases (if codeql CLI exists)'
                                dir('sast') {
                                    sh """
                                        if command -v codeql >/dev/null 2>&1; then
                                            echo 'Creating CodeQL DB for Go'
                                            codeql database create codeql-go --language=go --threads=0 --codescanning-config=../codeql-config.yml || true
                                            echo 'Creating CodeQL DB for JS/TS'
                                            codeql database create codeql-js --language=javascript-typescript --threads=0 --codescanning-config=../codeql-config.yml || true
                                        else
                                            echo 'codeql CLI not found, skipping CodeQL database creation'
                                        fi
                                    """
                                }
                            }
                        }

                        stage('Analyze with CodeQL (local queries)') {
                            steps {
                                echo 'Running CodeQL analysis using queries under sast/codeql-queries'
                                dir('sast') {
                                    sh """
                                        if command -v codeql >/dev/null 2>&1; then
                                            echo 'Analyzing Go DB with local query pack'
                                            codeql database analyze codeql-go --format=sarif-latest --output=../codeql-go-results.sarif --search-path=codeql-queries/go || true

                                            echo 'Analyzing JS/TS DB with local query pack'
                                            codeql database analyze codeql-js --format=sarif-latest --output=../codeql-js-results.sarif --search-path=codeql-queries/javascript || true
                                        else
                                            echo 'codeql CLI not found, skipping CodeQL analysis'
                                        fi
                                    """
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Build Backend') {
            agent { label 'builtin' }
            steps {
                echo 'Building and testing backend on builtin'
                dir('backend') {
                    sh """
                        if command -v go >/dev/null 2>&1; then
                            echo 'Running go test ./...'
                            go test ./...
                            echo 'Building backend binary'
                            go build ./...
                        else
                            echo 'go not found, skipping backend build'
                        fi
                    """
                }
            }
        }

        stage('Build Frontend') {
            agent { label 'builtin' }
            steps {
                echo 'Building frontend on builtin'
                dir('frontend') {
                    sh """
                        if command -v npm >/dev/null 2>&1; then
                            npm ci
                            npm run build
                        else
                            echo 'npm not found, skipping frontend build'
                        fi
                    """
                }
            }
        }

        stage('Docker Build & Push') {
            agent { label 'builtin' }
            steps {
                script {

                    def tag = sh(script: "git rev-parse --short=7 HEAD || echo ${env.BUILD_NUMBER}", returnStdout: true).trim()
                    env.IMAGE_TAG = tag
                    echo "Using image tag: ${env.IMAGE_TAG}"

                    def backendImage = "fauzanghaza/brawijaya-devsecops-backend:${env.IMAGE_TAG}"
                    def frontendImage = "fauzanghaza/brawijaya-devsecops-frontend:${env.IMAGE_TAG}"


                    withCredentials([usernamePassword(credentialsId: 'nasigoreng', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                        sh '''
                            echo 'Logging in to Docker registry (via credentials)'
                            echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
                        '''
                    }


                    dir('backend') {
                        sh """
                            echo 'Building backend image: ${backendImage}'
                            docker build -t ${backendImage} -f Dockerfile .
                        """
                    }


                    dir('frontend') {
                        sh """
                            echo 'Building frontend image: ${frontendImage}'
                            docker build -t ${frontendImage} -f Dockerfile .
                        """
                    }


                    sh """
                        echo 'Tagging images with :latest'
                        docker tag ${backendImage} fauzanghaza/brawijaya-devsecops-backend:latest || true
                        docker tag ${frontendImage} fauzanghaza/brawijaya-devsecops-frontend:latest || true

                        echo 'Pushing backend image ${backendImage}'
                        docker push ${backendImage} || echo 'Push backend failed'
                        echo 'Pushing backend:latest'
                        docker push fauzanghaza/brawijaya-devsecops-backend:latest || echo 'Push backend:latest failed'

                        echo 'Pushing frontend image ${frontendImage}'
                        docker push ${frontendImage} || echo 'Push frontend failed'
                        echo 'Pushing frontend:latest'
                        docker push fauzanghaza/brawijaya-devsecops-frontend:latest || echo 'Push frontend:latest failed'
                    """
                }
            }
        }

        stage('Approval: Deploy to Production') {
            agent { label 'builtin' }
            steps {
                script {

                    def sarifLinks = []
                    if (fileExists('codeql-go-results.sarif')) {
                        sarifLinks << "${env.BUILD_URL}artifact/codeql-go-results.sarif"
                    }
                    if (fileExists('codeql-js-results.sarif')) {
                        sarifLinks << "${env.BUILD_URL}artifact/codeql-js-results.sarif"
                    }

                    def images = []
                    if (env.IMAGE_TAG) {
                        images << "fauzanghaza/brawijaya-devsecops-backend:${env.IMAGE_TAG}"
                        images << "fauzanghaza/brawijaya-devsecops-frontend:${env.IMAGE_TAG}"
                    }


                    def branchName = env.EFFECTIVE_BRANCH ?: env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'unknown'
                    if (!branchName) {
                        branchName = env.GIT_BRANCH
                    }
                    if (!branchName) {
                        branchName = 'unknown'
                    }

                    def msgLines = []
                    msgLines << "*Deployment READY for approval*"
                    msgLines << "Job: *${env.JOB_NAME}* Build: *${env.BUILD_NUMBER}*"
                    msgLines << "Branch: *${branchName}*"
                    if (images.size() > 0) {
                        msgLines << "Images: `${images.join(', ')}`"
                    }
                    if (sarifLinks.size() > 0) {
                        msgLines << "SAST reports: ${sarifLinks.join(', ')}"
                    }
                    msgLines << "Approve to deploy to *nasigoreng* (production node)."

                    def approvalMessage = msgLines.join('\n')

                    try {
                        slackSend(
                            channel: '#nasigoreng',
                            color: COLOR_MAP[currentBuild.currentResult ?: 'SUCCESS'],
                            message: approvalMessage
                        )
                    } catch (Exception e) {
                        echo "Warning: slackSend failed for approval notification: ${e.message}"
                    }


                    def user = input(
                        id: 'Proceed1',
                        message: 'Approve deployment to PRODUCTION?',
                        parameters: [string(defaultValue: '', description: 'Enter your name to approve', name: 'approver')]
                    )
                    echo "Deployment approved by: ${user}"
                }
            }
        }


        stage('Deploy to Production') {
            agent { label 'nasigoreng' }
            stages {
                stage('Generate environment files') {
                    steps {
                        withCredentials([file(credentialsId: 'nasigoreng-satu', variable: 'BACKEND_ENVFILE')]) {
                            sh '''
                                mkdir -p backend
                                cp "$BACKEND_ENVFILE" backend/.env
                                chmod 600 backend/.env
                            '''
                        }

                        withCredentials([file(credentialsId: 'nasigoreng-dua', variable: 'FRONTEND_ENVFILE')]) {
                            sh '''
                                mkdir -p frontend
                                cp "$FRONTEND_ENVFILE" frontend/.env
                                chmod 600 frontend/.env
                            '''
                        }
                    }
                }

                stage('Deploy with Docker Compose') {
                    steps {
                        echo 'Deploying to production on nasigoreng node using docker compose (using IMAGE_TAG env var)'
                        sh """
                            set -e
                            if command -v docker compose >/dev/null 2>&1; then
                                # Deploy backend using IMAGE_TAG environment variable
                                if [ -f backend/compose.yml ]; then
                                    echo "Deploying backend with IMAGE_TAG=${IMAGE_TAG}"
                                    IMAGE_TAG=${IMAGE_TAG} sudo docker compose -f backend/compose.yml pull || true
                                    IMAGE_TAG=${IMAGE_TAG} sudo docker compose -f backend/compose.yml up -d --remove-orphans || true
                                else
                                    echo 'backend/compose.yml not found, skipping backend compose'
                                fi

                                # Deploy frontend using IMAGE_TAG environment variable
                                if [ -f frontend/compose.yaml ]; then
                                    echo "Deploying frontend with IMAGE_TAG=${IMAGE_TAG}"
                                    IMAGE_TAG=${IMAGE_TAG} sudo docker compose -f frontend/compose.yaml pull || true
                                    IMAGE_TAG=${IMAGE_TAG} sudo docker compose -f frontend/compose.yaml up -d --remove-orphans || true
                                else
                                    echo 'frontend/compose.yaml not found, skipping frontend compose'
                                fi
                            else
                                echo 'docker compose not found on nasigoreng; please install or adjust deployment command'
                                exit 0
                            fi
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished'
            script {
                def buildDuration = (currentBuild.duration / 1000).intValue()
                def buildTime = String.format(
                    "%02d:%02d",
                    (buildDuration / 60).intValue(),
                    (buildDuration % 60).intValue()
                )

                def branchName = env.EFFECTIVE_BRANCH ?: env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'unknown'
                if (!branchName) {
                    branchName = env.GIT_BRANCH
                }
                if (!branchName) {
                    branchName = 'unknown'
                }

                def status = currentBuild.currentResult ?: 'UNKNOWN'
                def emoji = (status == 'SUCCESS') ? ':white_check_mark:' : ':x:'

                def imageInfo = ''
                if (env.IMAGE_TAG) {
                    imageInfo = "Images:\n" +
                        "• `fauzanghaza/brawijaya-devsecops-backend:${env.IMAGE_TAG}` (and :latest)\n" +
                        "• `fauzanghaza/brawijaya-devsecops-frontend:${env.IMAGE_TAG}` (and :latest)"
                }

                def lines = [
                    "*${status}* ${emoji} Job: *${env.JOB_NAME}* Build: *${env.BUILD_NUMBER}*",
                    "Branch: *${branchName}*",
                    "Build Duration: *${buildTime}*",
                    "More info: <${env.BUILD_URL}|View Build>"
                ]

                if (imageInfo) {
                    lines << imageInfo
                }

                if (status != 'SUCCESS') {
                    lines << ":exclamation: *Check logs for errors.* Contact the NasiGoreng team if assistance is needed."
                }

                def message = lines.join("\n")

                try {
                    def color = COLOR_MAP[status] ?: 'good'
                    slackSend(
                        channel: '#nasigoreng',
                        color: color,
                        message: message
                    )
                } catch (Exception e) {
                    echo "Warning: slackSend failed in post section: ${e.message}"
                }
            }
        }
    }
}