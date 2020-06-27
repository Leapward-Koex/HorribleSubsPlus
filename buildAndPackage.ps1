tsc

$exclude = @('*.png', '*.psd','*.config', '*.ts', '*.js.map')
$srcFolder = "src/**"
$destFolder = "output/"

If(test-path $destFolder)
{
    Remove-Item -path $destFolder -recurse
}

New-Item -ItemType Directory -Force -Path $destFolder

Get-ChildItem -Path $destFolder -Include * -File -Recurse | ForEach-Object { $_.Delete()}

Copy-Item -Path $srcFolder -Destination $destFolder -Recurse -Exclude $exclude

$zipDest = "HSPlusExtension.zip"
$compress = @{
    Path = "output/*"
    CompressionLevel = "Fastest"
    DestinationPath = $zipDest
}

If(test-path $zipDest)
{
    Remove-Item -path $zipDest
}
Compress-Archive @compress
  