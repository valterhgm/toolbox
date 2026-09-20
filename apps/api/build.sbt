val scala3Version           = "3.3.4"
val http4sVersion           = "0.23.27"
val circeVersion            = "0.14.9"
val munitCatsEffectVersion  = "2.0.0"
val mongo4catsVersion       = "0.7.18"

lazy val root = project
  .in(file("."))
  .settings(
    name         := "toolbox-api",
    version      := "0.1.0-SNAPSHOT",
    scalaVersion := scala3Version,
    libraryDependencies ++= Seq(
      "org.http4s"      %% "http4s-ember-server"       % http4sVersion,
      "org.http4s"      %% "http4s-dsl"                % http4sVersion,
      "org.http4s"      %% "http4s-circe"              % http4sVersion,
      "io.circe"        %% "circe-generic"             % circeVersion,
      "io.github.kirill5k" %% "mongo4cats-core"        % mongo4catsVersion,
      "io.github.kirill5k" %% "mongo4cats-circe"       % mongo4catsVersion,
      "org.typelevel"   %% "munit-cats-effect"         % munitCatsEffectVersion % Test
    ),
    testFrameworks += new TestFramework("munit.Framework"),
    Compile / run / fork := true
  )
