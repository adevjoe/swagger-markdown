import { OpenAPIV2 } from 'openapi-types';
import { transformResponses } from './pathResponses';
import { transformParameters } from './pathParameters';
import { transformSecurity } from './security';
import { Markdown } from '../../lib/markdown';
import { ALLOWED_METHODS } from '../../types';
import { transformExternalDocs } from './externalDocs';
import { transformSchemes } from './schemes';

/**
 * https://swagger.io/specification/v2/#pathsObject
 * https://swagger.io/specification/v2/#pathItemObject
 * https://swagger.io/specification/v2/#operationObject
 */
export function transformPath(
  path: string,
  data: OpenAPIV2.PathItemObject,
  _parameters?: OpenAPIV2.ParametersDefinitionsObject,
): string | null {
  let pathParameters: OpenAPIV2.Parameters = null;

  if (!path || !data) {
    return null;
  }

  const md = Markdown.md();

  // Check if parameter for path are in the place
  if ('parameters' in data) {
    pathParameters = data.parameters;
  }

  // Go further method by methods
  Object.keys(data).forEach((method) => {
    if (ALLOWED_METHODS.includes(method)) {
      const pathInfo: OpenAPIV2.OperationObject = data[method];

      // Set summary as a header
      if ('summary' in pathInfo) {
        md.line(md.string(pathInfo.summary).h3())
          .line()
      }

      // Make path as a header
      md.line(md.string(method.toUpperCase() + " " + path).inlineCode())
        .line();

      // Deprecation
      if ('deprecated' in pathInfo && pathInfo.deprecated === true) {
        md.line(md.string('DEPRECATED').bold().italic());
      }

      // Schemes
      if ('schemes' in pathInfo && pathInfo.schemes.length > 0) {
        md.line(transformSchemes(pathInfo.schemes));
      }

      // Set description
      if ('description' in pathInfo && pathInfo.description !== '') {
        md.line(md.string('Description:'))
          .line()
          .line(md.string(pathInfo.description).quote())
          .line();
      }

      // Set externalDocs
      if ('externalDocs' in pathInfo) {
        md.line(
          md.string('Documentation:').bold(),
          md.string(' '),
          transformExternalDocs(pathInfo.externalDocs),
        );
      }

      // Build parameters
      if ('parameters' in pathInfo || pathParameters) {
        const builtParameters = md.string(transformParameters(
          pathInfo.parameters,
          pathParameters,
        ));
        if (builtParameters.length) {
          md.line(builtParameters).line();
        }
      }

      // Build responses
      if ('responses' in pathInfo) {
        const builtResponses = md.string(transformResponses(
          pathInfo.responses,
        ));
        if (builtResponses.length) {
          md.line(builtResponses).line();
        }
      }

      // Build security
      if ('security' in pathInfo) {
        md.line(
          transformSecurity(pathInfo.security),
        );
      }
    }
  });

  return md.export();
}
