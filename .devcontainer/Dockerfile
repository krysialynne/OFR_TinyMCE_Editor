FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Install basic development utilities and .NET prerequisites
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    curl \
    wget \
    apt-transport-https \
    gnupg \
    ca-certificates \
    unzip

# Install .NET SDK (Required by the Power Platform Extension to run PAC on Linux, 
# and for building PCF solution packages)
RUN wget https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get -y install dotnet-sdk-8.0

# Install pnpm globally as root
RUN npm install -g pnpm

# Drop down to the standard non-root user
USER node
