/**
 * Shell Script Template
 * Looks like a legitimate deployment/backup script.
 */

module.exports = {
  header: `#!/bin/bash
#===============================================================================
#          FILE: deploy.sh
#         USAGE: ./deploy.sh [staging|production]
#   DESCRIPTION: Deployment script for the microservices architecture
#       OPTIONS: environment, --skip-tests, --force
#  REQUIREMENTS: docker, kubectl, helm
#          BUGS: Report to devops@example.com
#         NOTES: Run from the project root directory
#        AUTHOR: DevOps Team
#       VERSION: 2.1.0
#       CREATED: 2024-01-15
#      REVISION: 2024-03-20
#===============================================================================

set -euo pipefail
IFS=$'\\n\\t'
`,
  sections: [
    `#-------------------------------------------------------------------------------
# Configuration
#-------------------------------------------------------------------------------

readonly SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_NAME="myapp"
readonly REGISTRY="ghcr.io/example"
readonly CHART_PATH="./helm/\${PROJECT_NAME}"

# Colors for output
readonly RED='\\033[0;31m'
readonly GREEN='\\033[0;32m'
readonly YELLOW='\\033[1;33m'
readonly NC='\\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
SKIP_TESTS=false
FORCE_DEPLOY=false
DRY_RUN=false
`,
    `#-------------------------------------------------------------------------------
# Helper Functions
#-------------------------------------------------------------------------------

log_info() {
    echo -e "\${GREEN}[INFO]\${NC} $1"
}

log_warn() {
    echo -e "\${YELLOW}[WARN]\${NC} $1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} $1" >&2
}

die() {
    log_error "$1"
    exit 1
}

usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS] [ENVIRONMENT]

Deploy the application to the specified environment.

Arguments:
    ENVIRONMENT    Target environment (staging|production) [default: staging]

Options:
    -h, --help        Show this help message
    -s, --skip-tests  Skip running tests before deployment
    -f, --force       Force deployment even if tests fail
    -d, --dry-run     Show what would be deployed without actually deploying
    -v, --verbose     Enable verbose output

Examples:
    $(basename "$0") staging
    $(basename "$0") --skip-tests production
    $(basename "$0") --dry-run staging
EOF
}
`,
    `#-------------------------------------------------------------------------------
# Argument Parsing
#-------------------------------------------------------------------------------

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            *)
                log_warn "Unknown option: $1"
                shift
                ;;
        esac
    done
}
`,
    `#-------------------------------------------------------------------------------
# Pre-deployment Checks
#-------------------------------------------------------------------------------

check_prerequisites() {
    log_info "Checking prerequisites..."

    command -v docker >/dev/null 2>&1 || die "Docker is required but not installed"
    command -v kubectl >/dev/null 2>&1 || die "kubectl is required but not installed"
    command -v helm >/dev/null 2>&1 || die "Helm is required but not installed"

    # Verify kubeconfig context
    local current_context
    current_context=$(kubectl config current-context 2>/dev/null) || die "No kubectl context set"
    log_info "Using context: $current_context"

    # Verify registry access
    if ! docker info >/dev/null 2>&1; then
        die "Cannot connect to Docker daemon"
    fi
}
`,
    `run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log_warn "Skipping tests as requested"
        return 0
    fi

    log_info "Running test suite..."

    if [[ -f "package.json" ]]; then
        npm test || {
            if [[ "$FORCE_DEPLOY" == true ]]; then
                log_warn "Tests failed but force deploy is enabled"
            else
                die "Tests failed. Use --force to deploy anyway."
            fi
        }
    elif [[ -f "Cargo.toml" ]]; then
        cargo test || {
            if [[ "$FORCE_DEPLOY" == true ]]; then
                log_warn "Tests failed but force deploy is enabled"
            else
                die "Tests failed. Use --force to deploy anyway."
            fi
        }
    elif [[ -f "go.mod" ]]; then
        go test ./... || {
            if [[ "$FORCE_DEPLOY" == true ]]; then
                log_warn "Tests failed but force deploy is enabled"
            else
                die "Tests failed. Use --force to deploy anyway."
            fi
        }
    fi

    log_info "All tests passed"
}
`,
    `#-------------------------------------------------------------------------------
# Build and Push
#-------------------------------------------------------------------------------

build_image() {
    local tag="$1"
    local image_name="\${REGISTRY}/\${PROJECT_NAME}:\${tag}"

    log_info "Building Docker image: $image_name"

    docker build \\
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \\
        --build-arg VCS_REF="$(git rev-parse --short HEAD)" \\
        --build-arg VERSION="$tag" \\
        -t "$image_name" \\
        -f Dockerfile \\
        .

    log_info "Pushing image to registry..."
    docker push "$image_name"

    echo "$image_name"
}
`,
    `#-------------------------------------------------------------------------------
# Deploy
#-------------------------------------------------------------------------------

deploy() {
    local image_tag="$1"
    local image_name="\${REGISTRY}/\${PROJECT_NAME}:\${image_tag}"

    log_info "Deploying to $ENVIRONMENT..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN - Would execute:"
        echo "  helm upgrade --install \$PROJECT_NAME \$CHART_PATH \\"
        echo "    --namespace \$ENVIRONMENT \\"
        echo "    --set image.tag=\$image_tag \\"
        echo "    --values values-\$ENVIRONMENT.yaml \\"
        echo "    --wait --timeout 10m"
        return 0
    fi

    helm upgrade --install "$PROJECT_NAME" "$CHART_PATH" \\
        --namespace "$ENVIRONMENT" \\
        --create-namespace \\
        --set "image.tag=$image_tag" \\
        --values "values-\${ENVIRONMENT}.yaml" \\
        --wait \\
        --timeout 10m \\
        --atomic

    log_info "Deployment completed successfully"
}
`,
    `#-------------------------------------------------------------------------------
# Main
#-------------------------------------------------------------------------------

main() {
    parse_args "$@"

    log_info "Starting deployment to $ENVIRONMENT"
    log_info "Working directory: $SCRIPT_DIR"

    check_prerequisites
    run_tests

    local git_sha
    git_sha=$(git rev-parse --short HEAD)
    local tag="\${git_sha}-$(date +%Y%m%d%H%M%S)"

    build_image "$tag"
    deploy "$tag"

    log_info "Deployment finished at $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
}

main "$@"
`  ],
  footer: `
# vim: set ts=4 sw=4 et:
`,
  slots: 8
};
