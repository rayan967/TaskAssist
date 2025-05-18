# ------------------------------------------
# start.ps1  –  Launch TaskAssist back-end
# ------------------------------------------

$env:SPRING_DATASOURCE_URL      = "jdbc:postgresql://localhost:5432/taskassist"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "8426"
$env:SERVER_PORT = "8090"

# (optional) active profile
# $env:SPRING_PROFILES_ACTIVE = "dev"

# Run
.\mvnw.cmd spring-boot:run
