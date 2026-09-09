pipeline {
    agent any

    environment {
        // Define environment variables here
        APP_DIR = '/opt/ims'
        BACKEND = 'IMS_BACKEND_CURRENT/imsbackend/mainjav'
        FRONTEND = 'IMS_FRONTEND_CURRENT'
        COMPOSE_FILE = 'docker-compose.yml'
        ENV_FILE = '.env'
    }
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                git branch 'feature'
                git url 'https://github.com/kandha120/ims.git'
            }
        }
        stage('Build Backend') {
            steps {
                echo 'Building backend...'
                sh '''
                    set -e
                    cd ${APP_DIR}/${BACKEND}
                    chmod +x mvnw
                    ./mvnw clean test && ./mvnw clean package -DskipTests
                '''
            }
        }
        stage('Build Frontend') {
            steps {
                echo 'Building frontend...'
                sh '''
                    set -e
                    cd ${APP_DIR}/${FRONTEND}
                    npm ci && npm run lint
                    npm run build
                '''
            }
        }
        stage('Docker Build Images') {
            steps {
                echo 'Building Docker images...'
                sh '''
                    set -e
                    cd ${APP_DIR}
                    echo 'Building Docker images...'
                        docker compose -f ${COMPOSE_FILE} build
                '''
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                sh '''
                    set -e
                    cd ${APP_DIR}
                    echo 'Starting Docker containers...'
                    docker compose -f ${COMPOSE_FILE} up -d
                '''
            }
        }
    }
}
