/**
 * SCRIPT DE MIGRACIÓN: Passwords base64 → PBKDF2
 * 
 * Cómo usar:
 * 1. Coloca este archivo en: prisma/migrate-passwords.ts
 * 2. Ejecuta: npx bun run prisma/migrate-passwords.ts
 * 3. Verifica que todos los usuarios se actualizaron
 * 
 * IMPORTANTE: Haz backup de la base de datos antes de ejecutar
 */

import { db } from '../src/lib/db'
import { PasswordManager } from '../src/lib/security'

async function migratePasswords() {
  console.log('🔐 Iniciando migración de passwords...\n')

  try {
    const users = await db.user.findMany()
    console.log(`📊 Total de usuarios: ${users.length}\n`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const user of users) {
      try {
        // Verificar si ya está hasheado (contiene :)
        if (user.password.includes(':')) {
          console.log(`⏭️  ${user.email}: Ya está migrado (skip)`)
          skipped++
          continue
        }

        // Asumir que está en base64
        let decoded: string
        try {
          decoded = Buffer.from(user.password, 'base64').toString('utf-8')
        } catch {
          console.log(`❌ ${user.email}: No se pudo decodificar (posiblemente ya haseado)`)
          errors++
          continue
        }

        // Validar que se decodificó correctamente
        if (!decoded || decoded.length < 3) {
          console.log(
            `⚠️  ${user.email}: Decodificación sospechosa (longitud: ${decoded?.length})`
          )
          errors++
          continue
        }

        // Hashear con el nuevo método
        const newHash = PasswordManager.hashPassword(decoded)

        // Actualizar en base de datos
        await db.user.update({
          where: { id: user.id },
          data: { password: newHash },
        })

        console.log(`✅ ${user.email}: Migrado exitosamente`)
        migrated++
      } catch (error) {
        console.error(`❌ ${user.email}: Error durante migración:`, error)
        errors++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📈 RESULTADO:')
    console.log(`  ✅ Migrados: ${migrated}`)
    console.log(`  ⏭️  Ya migrados: ${skipped}`)
    console.log(`  ❌ Errores: ${errors}`)
    console.log('='.repeat(50))

    if (errors === 0) {
      console.log('\n✨ ¡Migración completada sin errores!')
    } else {
      console.log(
        '\n⚠️  Hay algunos usuarios que necesitan atención manual.'
      )
    }

    process.exit(0)
  } catch (error) {
    console.error('🔴 Error crítico:', error)
    process.exit(1)
  }
}

// Ejecutar migración
migratePasswords()
