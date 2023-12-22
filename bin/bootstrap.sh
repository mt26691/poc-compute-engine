echo "Installing dependencies in infra folder"
(cd infra && npm ci)
echo "Installing dependencies in server folder"
(cd server && npm ci)
