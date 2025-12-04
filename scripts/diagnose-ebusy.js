#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Diagnóstico EBUSY para proyecto NestJS');
console.log('='.repeat(50));

const projectPath = process.cwd();
const distPath = path.join(projectPath, 'dist');
const problematicFile = path.join(distPath, 'sensores', 'sensores.module.d.ts');

function checkFileStatus(filePath) {
  console.log(`\n📁 Verificando estado del archivo: ${filePath}`);
  
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`   ✅ Archivo existe`);
      console.log(`   📅 Última modificación: ${stats.mtime}`);
      console.log(`   📏 Tamaño: ${stats.size} bytes`);
      console.log(`   🔒 Permisos: ${stats.mode}`);
    } else {
      console.log(`   ❌ Archivo no existe`);
    }
  } catch (error) {
    console.log(`   ❌ Error accediendo al archivo: ${error.message}`);
  }
}

function checkProcessActivity() {
  console.log('\n🔄 Verificando procesos activos...');
  
  try {
    // Verificar si hay procesos Node.js activos
    const nodeProcesses = execSync('tasklist /FI "IMAGENAME eq node.exe" 2>NUL', { encoding: 'utf8' });
    if (nodeProcesses.includes('node.exe')) {
      console.log('   ⚠️  Procesos Node.js encontrados:');
      console.log(nodeProcesses);
    } else {
      console.log('   ✅ No hay procesos Node.js activos');
    }
  } catch (error) {
    console.log('   ✅ No hay procesos Node.js activos');
  }
  
  try {
    // Verificar si hay procesos nest activos
    const nestProcesses = execSync('tasklist /FI "COMMANDLINE nest*" 2>NUL', { encoding: 'utf8' });
    if (nestProcesses.includes('nest')) {
      console.log('   ⚠️  Procesos Nest CLI encontrados:');
      console.log(nestProcesses);
    }
  } catch (error) {
    console.log('   ✅ No hay procesos Nest CLI activos');
  }
}

function checkDirectoryLocks() {
  console.log('\n🔒 Verificando bloqueos del directorio...');
  
  try {
    const files = fs.readdirSync(distPath, { recursive: true });
    console.log(`   📂 Archivos en dist/: ${files.length} archivos encontrados`);
    
    files.forEach(file => {
      const filePath = path.join(distPath, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          // Intentar abrir el archivo en modo compartido
          const fd = fs.openSync(filePath, 'r');
          fs.closeSync(fd);
        }
      } catch (error) {
        console.log(`   ❌ Archivo bloqueado: ${file} - ${error.code}`);
      }
    });
  } catch (error) {
    console.log(`   ❌ Error leyendo directorio dist/: ${error.message}`);
  }
}

function checkTypeScriptCompilation() {
  console.log('\n⚡ Verificando compilación TypeScript...');
  
  try {
    // Verificar si TypeScript está instalado
    const tsVersion = execSync('npx tsc --version', { encoding: 'utf8' });
    console.log(`   📦 TypeScript: ${tsVersion.trim()}`);
  } catch (error) {
    console.log(`   ❌ TypeScript no disponible: ${error.message}`);
  }
  
  try {
    // Verificar configuración de tsconfig
    const tsconfig = JSON.parse(fs.readFileSync(path.join(projectPath, 'tsconfig.json'), 'utf8'));
    console.log(`   ⚙️  Configuración TypeScript encontrada`);
    console.log(`   📁 Source root: ${tsconfig.compilerOptions?.rootDir || 'No especificado'}`);
  } catch (error) {
    console.log(`   ❌ Error leyendo tsconfig.json: ${error.message}`);
  }
}

function suggestSolutions() {
  console.log('\n💡 Soluciones sugeridas:');
  console.log('1. 🧹 Limpiar directorio dist/ completamente');
  console.log('2. 🔄 Reiniciar el sistema de archivos con: fsutil usp flush');
  console.log('3. ⏰ Esperar 30 segundos y reintentar');
  console.log('4. 🔒 Verificar que no hay antivirus bloqueando archivos');
  console.log('5. 🐍 Ejecutar: nest start --watch --verbose para más logs');
}

// Ejecutar diagnóstico completo
checkFileStatus(problematicFile);
checkProcessActivity();
checkDirectoryLocks();
checkTypeScriptCompilation();
suggestSolutions();

console.log('\n' + '='.repeat(50));
console.log('🏁 Diagnóstico completado');