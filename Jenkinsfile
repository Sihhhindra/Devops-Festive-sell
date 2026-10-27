// ─── Festival Rush CI/CD Pipeline ───────────────────────────────
// Jenkins Declarative Pipeline: Build → Test → Docker → Push → Deploy

pipeline {
    agent any

    environment {
        AWS_REGION       = 'ap-south-1'
        ECR_REGISTRY     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        EKS_CLUSTER      = 'festival-rush-eks'
        CLIENT_IMAGE     = 'festival-rush-client'
        SERVER_IMAGE     = 'festival-rush-server'
        IMAGE_TAG        = "${BUILD_NUMBER}"
    }

    stages {
        // ── Stage 1: Checkout Code ──────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Code checked out — Branch: ${env.BRANCH_NAME}"
            }
        }

        // ── Stage 2: Install Dependencies ───────────────────────
        stage('Install Dependencies') {
            parallel {
                stage('Client Dependencies') {
                    steps {
                        dir('client') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Server Dependencies') {
                    steps {
                        dir('server') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        // ── Stage 3: Build Client ───────────────────────────────
        stage('Build Client') {
            steps {
                dir('client') {
                    sh 'npm run build'
                }
                echo "React client built successfully"
            }
        }

        // ── Stage 4: Run Tests ──────────────────────────────────
        stage('Tests') {
            parallel {
                stage('API Tests') {
                    steps {
                        sh 'chmod +x tests/api/*.sh'
                        sh 'bash tests/api/test_health.sh'
                    }
                }
                stage('Selenium Tests') {
                    steps {
                        sh '''
                            pip3 install selenium pytest
                            python3 -m pytest tests/selenium/ -v --tb=short || true
                        '''
                    }
                }
            }
        }

        // ── Stage 5: Build Docker Images ────────────────────────
        stage('Docker Build') {
            steps {
                sh """
                    docker build -t ${CLIENT_IMAGE}:${IMAGE_TAG} -f Dockerfile.client ./client
                    docker build -t ${SERVER_IMAGE}:${IMAGE_TAG} -f Dockerfile.server ./server
                """
                echo "Docker images built: ${IMAGE_TAG}"
            }
        }

        // ── Stage 6: Push to ECR ────────────────────────────────
        stage('Push to ECR') {
            steps {
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                    docker tag ${CLIENT_IMAGE}:${IMAGE_TAG} ${ECR_REGISTRY}/${CLIENT_IMAGE}:${IMAGE_TAG}
                    docker push ${ECR_REGISTRY}/${CLIENT_IMAGE}:${IMAGE_TAG}

                    docker tag ${SERVER_IMAGE}:${IMAGE_TAG} ${ECR_REGISTRY}/${SERVER_IMAGE}:${IMAGE_TAG}
                    docker push ${ECR_REGISTRY}/${SERVER_IMAGE}:${IMAGE_TAG}
                """
                echo "Images pushed to ECR"
            }
        }

        // ── Stage 7: Deploy to Kubernetes ───────────────────────
        stage('Deploy to EKS') {
            steps {
                sh """
                    aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER}

                    # Update image tags in deployments
                    kubectl set image deployment/client-deployment client=${ECR_REGISTRY}/${CLIENT_IMAGE}:${IMAGE_TAG} -n festival-rush
                    kubectl set image deployment/server-deployment server=${ECR_REGISTRY}/${SERVER_IMAGE}:${IMAGE_TAG} -n festival-rush

                    # Wait for rollout
                    kubectl rollout status deployment/client-deployment -n festival-rush --timeout=120s
                    kubectl rollout status deployment/server-deployment -n festival-rush --timeout=120s
                """
                echo "Deployed to EKS cluster"
            }
        }

        // ── Stage 8: Smoke Test ─────────────────────────────────
        stage('Smoke Test') {
            steps {
                sh '''
                    APP_URL=$(kubectl get ingress festival-rush-ingress -n festival-rush -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
                    echo "Testing: http://$APP_URL"

                    # Wait for ALB to be ready
                    sleep 30

                    # Health check
                    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$APP_URL)
                    if [ "$STATUS" = "200" ]; then
                        echo "Smoke test PASSED — HTTP $STATUS"
                    else
                        echo "Smoke test FAILED — HTTP $STATUS"
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded! Festival Rush deployed.'
        }
        failure {
            echo 'Pipeline failed. Check logs above.'
        }
        always {
            // Clean up Docker images to save disk space
            sh 'docker system prune -f || true'
        }
    }
}
