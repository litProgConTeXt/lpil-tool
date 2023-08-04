
import fsp  from "fs/promises"
import path from "path"
import yaml from "yaml"

import { BuildConfig             } from "lpil-modules/dist/lib/configBuild.js"
import { Builders                } from "lpil-modules/dist/lib/builders.js"
import { Grammars                } from "lpil-modules/dist/lib/grammars.js"
import { Document, DocumentCache } from "lpil-modules/dist/lib/documents.js"
import { ScopeActions            } from "lpil-modules/dist/lib/scopeActions.js"
import { Structures              } from "lpil-modules/dist/lib/structures.js"

import { Logging, ValidLogger  } from "lpil-modules/dist/lib/logging.js"
import { BaseConfig } from "lpil-modules/dist/lib/configBase"

const logger : ValidLogger = Logging.getLogger('lpil')

class CodeChunk {
  startLine : number
  stopLine  : number
  theLines  : string[]
  docName   : string
  constructor(
    startLine : number, stopLine : number, theLines : string[], docName : string
  ) {
    this.startLine = startLine
    this.stopLine  = stopLine
    this.theLines  = theLines
    this.docName   = docName
  }
}

class NamedCodeChunks {
  codeName : string | undefined
  start    : number | undefined
  codeChunks : Map<string, CodeChunk[]> = new Map()
}

class TypedCodeChunks {
  namedCodeChunks : Map<string, NamedCodeChunks> = new Map()

  getTypedCodeFor(codeType : string) {
    if (!this.namedCodeChunks.has(codeType))
      this.namedCodeChunks.set(codeType, new NamedCodeChunks())
    return this.namedCodeChunks.get(codeType)
  }
}

export class DocCodeChunks {
  typedCodeChunks : Map<string, TypedCodeChunks> = new Map()

  // We place `docName` as the base index to reduce the rare chance of race
  // conditions when working asynchronously
  //
  getTypedCodeFor(docName : string, codeType : string) {
    if (!this.typedCodeChunks.has(docName)) 
      this.typedCodeChunks.set(docName, new TypedCodeChunks())
    const typedCode = this.typedCodeChunks.get(docName)
    if (typedCode) {
      return typedCode.getTypedCodeFor(codeType)
    }
  }

  startCodeFor(
    docName : string, codeType : string, codeName : string, lineNumber : number
  ) {
    const theCode = this.getTypedCodeFor(docName, codeType)
    if (theCode) {
      theCode.codeName = codeName
      theCode.start    = lineNumber
    }
  }

  stopCodeFor(
    docName : string, codeType : string, lineNumber : number, docLines : string[]
  ) {
    const theCode = this.getTypedCodeFor(docName, codeType)

    if (theCode) {
      if (!theCode.start) {
        logger.warn(`WARNING: no start of ${codeType} in ${docName}`)
        logger.warn(`  ... ignoring the chunk that ends at ${lineNumber}!`)
        delete theCode.start
        delete theCode.codeName
        return
      }
      const startLine = theCode.start
      const codeName  = theCode.codeName
      if (startLine && codeName) {
        const stopLine  = lineNumber
        if (stopLine <= startLine) {
          logger.warn(`WARNING: no ${codeType} found between ${startLine} and ${stopLine} in ${docName}`)
          logger.warn("  ... ignoring this chuck!")
          delete theCode.start
          delete theCode.codeName
          return
        }
        if (!theCode.codeChunks.has(codeName))
          theCode.codeChunks.set(codeName, [])
        const someCode = theCode.codeChunks.get(codeName)
        if (someCode) someCode.push(new CodeChunk(
          startLine, stopLine, docLines.slice(startLine+1, stopLine), docName
          ))
          delete theCode.start
          delete theCode.codeName
      }
    }
  }
      
  async finalize(config : BuildConfig) {
    const srcDir   = config.replaceTemplate(config.srcDir)
    logger.trace(`ENSURING the [${srcDir}] directory exists`)
    await fsp.mkdir(srcDir, { recursive: true })
    
    const latexDir = config.replaceTemplate(config.latexDir)
    logger.trace(`ENSURING the [${latexDir}] directory exists`)
    await fsp.mkdir(latexDir, { recursive: true })

    for (const [ aDocName, someDocCode] of this.typedCodeChunks.entries()) {
      for (const [ aCodeType, someTypedCode] of someDocCode.namedCodeChunks.entries()) {
        for (const [ aCodeName, someNamedCode] of someTypedCode.codeChunks.entries()) {
          var theCode : string[] = []
          const chunks   = someNamedCode
          var   chunkNum = 1
          for (const aChunk of chunks) {
            // write out this chunk...
            const chunkNameArray : Array<string> = []
            chunkNameArray.push(aCodeName)
            chunkNameArray.push('-')
            chunkNameArray.push(aDocName)
            chunkNameArray.push('-c')
            const chunkNumStr = "00000"+chunkNum
            chunkNum += 1
            chunkNameArray.push(chunkNumStr.substring(chunkNumStr.length-5))
            chunkNameArray.push('.chunk')
            const chunkPath = path.join(latexDir, chunkNameArray.join(''))
            logger.debug(`WRITING this chunk to [${chunkPath}]`)
            await fsp.writeFile(chunkPath, aChunk['theLines'].join('\n'))
  
            // append this chunk to the accumulated code
            theCode = theCode.concat(aChunk['theLines'])
          }
          // write out this source code...
          const codePath = path.join(srcDir, aCodeName)
          logger.trace(`WRITING source code to [${codePath}]`)
          await fsp.writeFile(codePath, theCode.join('\n'))
        }
      }
    }    
  }
}

export class CodeTypes {
  codeTypes : Map<string, string> = new Map()

  constructor() { }

  addCodeType(aCodeType : string, someOptions : string) {
    this.codeTypes.set(aCodeType, someOptions)
  }
}

export function registerActions(
  config        : BuildConfig,
  builders      : Builders,
  documentCache : DocumentCache,
  grammars      : Grammars,
  scopeActions  : ScopeActions,
  structures    : Structures,
  logger        : ValidLogger
) {

  structures.newStructure('codeTypes', new CodeTypes())
  structures.newStructure('code',      new DocCodeChunks())

  scopeActions.addScopedAction(
    'keyword.control.newcodetype.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      const codeType = theTokens[1]
      const codeOptions = theTokens[3]
      logger.debug("----------------------------------------------------------")
      logger.debug("newCodeType")
      logger.trace(`   thisScope: ${thisScope}`)
      logger.trace(`    theScope: ${theScope}`)
      logger.debug(`    codeType: ${codeType}`)
      logger.debug(` codeOptions: ${codeOptions}`)
      logger.debug(`   theTokens: ${theTokens}`)
      logger.trace(`     theLine: ${theLine}`)
      if (theDoc) logger.trace(`      theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------")
      const codeTypes = <CodeTypes>structures.getStructure('codeTypes')
      if (theDoc) 
        codeTypes.addCodeType(codeType, codeOptions)
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.source.start.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      const codeType = theTokens[1]
      const codeName = theTokens[3]
      logger.debug("----------------------------------------------------------")
      logger.debug("startCode")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.debug(` codeType: ${codeType}`)
      logger.debug(` codeName: ${codeName}`)
      logger.debug(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      if (theDoc) logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------")
      const code = <DocCodeChunks>structures.getStructure('code')
      if (theDoc) 
        code.startCodeFor(theDoc.docName, codeType, codeName, theLine)
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.source.stop.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      const codeType = theTokens[1]
      logger.debug("----------------------------------------------------------")
      logger.debug("stopCode")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.debug(` codeType: ${codeType}`)
      logger.debug(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      if (theDoc) logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------") 
      const code = <DocCodeChunks>structures.getStructure('code')
      if (theDoc) 
        code.stopCodeFor(theDoc.docName, codeType, theLine, theDoc.docLines)
    }
  )

  scopeActions.addScopedAction(
    'finalize.control.source',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("finalizeCode")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      //logger.trace(`  theLine: ${theLine}`)
      //logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const code = <DocCodeChunks>structures.getStructure('code')
      await code.finalize(config)
    }
  )

}