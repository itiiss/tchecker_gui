import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  TextField,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Tooltip
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

const operatorTokens = ['&&', '||']

const normalizeFormulaInput = (formula) => {
  if (typeof formula !== 'string') {
    return ''
  }

  const mergedIdentifiers = formula.replace(/([A-Za-z0-9_])\s+(?=[A-Za-z0-9_])/g, '$1')

  return mergedIdentifiers
    .replace(/\s*(\()\s*/g, '$1')
    .replace(/\s*(\))\s*/g, '$1')
    .replace(/\s*(\|\||&&)\s*/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim()
}

const tokenizeFormula = (formula) => {
  const tokens = []
  let buffer = ''

  const sourceFormula = typeof formula === 'string' ? formula : ''
  const normalizedFormula = normalizeFormulaInput(sourceFormula)

  const pushBuffer = () => {
    if (buffer) {
      tokens.push({ type: 'label', value: buffer })
      buffer = ''
    }
  }

  for (let i = 0; i < normalizedFormula.length; i += 1) {
    const char = normalizedFormula[i]

    if (/\s/.test(char)) {
      pushBuffer()
      continue
    }

    if (/[A-Za-z0-9_]/.test(char)) {
      buffer += char
      continue
    }

    if (char === '(' || char === ')') {
      pushBuffer()
      tokens.push({ type: 'paren', value: char })
      continue
    }

    if (char === '&' || char === '|') {
      const nextChar = normalizedFormula[i + 1]
      const operator = `${char}${nextChar}`
      if (!operatorTokens.includes(operator)) {
        throw new Error('Only && and || operators are supported')
      }
      pushBuffer()
      tokens.push({ type: 'operator', value: operator })
      i += 1
      continue
    }

    if (char === '!') {
      throw new Error(
        'Negation (!) is not supported. Please express the property using positive labels only.'
      )
    }

    throw new Error(`Unsupported character "${char}" in formula`)
  }

  pushBuffer()

  if (tokens.length === 0) {
    throw new Error('Formula cannot be empty')
  }

  return tokens
}

const parseFormulaTokens = (tokens) => {
  let index = 0

  const parseExpression = () => parseOr()

  const parseOr = () => {
    let node = parseAnd()
    while (tokens[index]?.type === 'operator' && tokens[index].value === '||') {
      index += 1
      node = { type: 'or', left: node, right: parseAnd() }
    }
    return node
  }

  const parseAnd = () => {
    let node = parsePrimary()
    while (tokens[index]?.type === 'operator' && tokens[index].value === '&&') {
      index += 1
      node = { type: 'and', left: node, right: parsePrimary() }
    }
    return node
  }

  const parsePrimary = () => {
    const token = tokens[index]
    if (!token) {
      throw new Error('Unexpected end of formula')
    }

    if (token.type === 'label') {
      index += 1
      return { type: 'label', value: token.value }
    }

    if (token.type === 'paren' && token.value === '(') {
      index += 1
      const expression = parseExpression()
      if (tokens[index]?.type !== 'paren' || tokens[index].value !== ')') {
        throw new Error('Mismatched parentheses in formula')
      }
      index += 1
      return expression
    }

    throw new Error('Invalid token sequence in formula')
  }

  const ast = parseExpression()

  if (index !== tokens.length) {
    throw new Error('Invalid trailing tokens in formula')
  }

  return ast
}

const astToClauses = (node) => {
  if (!node) {
    return []
  }

  if (node.type === 'label') {
    return [[node.value]]
  }

  if (node.type === 'or') {
    return [...astToClauses(node.left), ...astToClauses(node.right)]
  }

  if (node.type === 'and') {
    const leftClauses = astToClauses(node.left)
    const rightClauses = astToClauses(node.right)

    const combined = []
    leftClauses.forEach((left) => {
      rightClauses.forEach((right) => {
        combined.push([...new Set([...left, ...right])])
      })
    })
    return combined
  }

  throw new Error('Unsupported formula node encountered')
}

const extractFormulaDetails = (formula) => {
  const tokens = tokenizeFormula(formula)
  const ast = parseFormulaTokens(tokens)
  const clauses = astToClauses(ast)
  const labels = Array.from(new Set(clauses.flat()))
  return { clauses, labels }
}

const PropertyForm = ({ open, property, availableLabels, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    type: 'reachability',
    targetLabel: '',
    secondaryLabel: '',
    formula: '',
    formulaMode: 'forbid'
  })
  const [errors, setErrors] = useState({})

  const needsPrimaryLabel = ['reachability', 'safety', 'mutual-exclusion'].includes(formData.type)
  const needsSecondaryLabel = formData.type === 'mutual-exclusion'
  const isFormulaType = formData.type === 'logic-formula'

  useEffect(() => {
    const initialType = property?.type || 'reachability'
    const resolvedLabels = Array.isArray(property?.labels) ? property.labels : []
    const initialPrimaryLabel =
      initialType === 'deadlock-free'
        ? ''
        : property?.targetLabel || resolvedLabels[0] || availableLabels[0] || ''

    let initialSecondaryLabel = ''
    if (initialType === 'mutual-exclusion') {
      initialSecondaryLabel =
        property?.secondaryLabel ||
        resolvedLabels[1] ||
        availableLabels.find((label) => label !== initialPrimaryLabel) ||
        ''
    }

    const initialFormula = property?.formula || ''
    const initialFormulaMode = property?.formulaMode || 'forbid'

    setFormData({
      type: initialType,
      targetLabel: initialPrimaryLabel,
      secondaryLabel: initialSecondaryLabel,
      formula: initialFormula,
      formulaMode: initialFormulaMode
    })
    setErrors({})
  }, [property, open, availableLabels])

  useEffect(() => {
    if (isFormulaType) {
      return
    }

    if (!needsPrimaryLabel && formData.targetLabel) {
      setFormData((prev) => ({ ...prev, targetLabel: '' }))
    }

    if (needsPrimaryLabel && !formData.targetLabel && availableLabels.length > 0) {
      setFormData((prev) => ({ ...prev, targetLabel: availableLabels[0] }))
    }

    if (!needsSecondaryLabel && formData.secondaryLabel) {
      setFormData((prev) => ({ ...prev, secondaryLabel: '' }))
    }

    if (needsSecondaryLabel) {
      const alternativeLabels = availableLabels.filter((label) => label !== formData.targetLabel)
      if (!formData.secondaryLabel && alternativeLabels.length > 0) {
        setFormData((prev) => ({ ...prev, secondaryLabel: alternativeLabels[0] }))
      }
      if (formData.secondaryLabel && formData.secondaryLabel === formData.targetLabel) {
        const firstAlternative = alternativeLabels[0] || ''
        setFormData((prev) => ({ ...prev, secondaryLabel: firstAlternative }))
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type, formData.targetLabel, availableLabels])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    let computedFormulaLabels = []

    if (needsPrimaryLabel && !formData.targetLabel) {
      newErrors.targetLabel = 'Please select a target label'
    }

    if (needsSecondaryLabel && !formData.secondaryLabel) {
      newErrors.secondaryLabel = 'Please select another label'
    }

    if (
      needsSecondaryLabel &&
      formData.targetLabel &&
      formData.secondaryLabel &&
      formData.targetLabel === formData.secondaryLabel
    ) {
      newErrors.secondaryLabel = 'Labels must be different for mutual exclusion'
    }

    if (isFormulaType) {
      const cleanedFormula = normalizeFormulaInput(formData.formula)

      if (!cleanedFormula) {
        newErrors.formula = 'Please enter a boolean expression using labels'
      } else {
        try {
          const { labels } = extractFormulaDetails(cleanedFormula)
          if (labels.length === 0) {
            throw new Error('Formula must reference at least one label')
          }
          const unknownLabels = labels.filter((label) => !availableLabels.includes(label))
          if (unknownLabels.length > 0) {
            throw new Error(`Unknown labels: ${unknownLabels.join(', ')}`)
          }
          computedFormulaLabels = labels
        } catch (error) {
          newErrors.formula = error.message
        }
      }
    }

    setErrors(newErrors)
    return {
      isValid: Object.keys(newErrors).length === 0,
      formulaLabels: computedFormulaLabels,
      normalizedFormula: isFormulaType ? normalizeFormulaInput(formData.formula) : undefined
    }
  }

  const handleSave = () => {
    const { isValid, formulaLabels, normalizedFormula } = validateForm()
    if (isValid) {
      onSave({
        ...formData,
        formula: normalizedFormula ?? formData.formula,
        formulaLabels
      })
    }
  }

  const getVerificationTypeDescription = (type) => {
    switch (type) {
      case 'reachability':
        return 'Check if there exists a path to a state with the specified label'
      case 'safety':
        return 'Check if the system will never reach a state with the specified label'
      case 'deadlock-free':
        return 'Check if the system is free of deadlock states'
      case 'mutual-exclusion':
        return 'Ensure two labels are never active at the same time in reachable states'
      case 'logic-formula':
        return 'Validate a boolean expression over labels. Use &&, || and parentheses only.'
      default:
        return ''
    }
  }

  const primarySelectionDisabled = needsPrimaryLabel && availableLabels.length === 0
  const secondarySelectionDisabled =
    needsSecondaryLabel &&
    availableLabels.filter((label) => label !== formData.targetLabel).length === 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{property ? 'Edit Property' : 'Add Property'}</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
        <FormControl fullWidth required sx={{ mt: 1 }}>
          <InputLabel>Property Type</InputLabel>
          <Select value={formData.type} onChange={handleChange('type')} label="Property Type">
            <MenuItem value="reachability">Reachability</MenuItem>
            <MenuItem value="safety">Safety</MenuItem>
            <MenuItem value="deadlock-free">Deadlock-Free</MenuItem>
            <MenuItem value="mutual-exclusion">Mutual Exclusion</MenuItem>
            <MenuItem value="logic-formula">Logical Formula</MenuItem>
          </Select>
        </FormControl>

        <Alert severity="info">
          <Typography variant="body2">{getVerificationTypeDescription(formData.type)}</Typography>
        </Alert>

        {isFormulaType && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2">Boolean Expression</Typography>
              <Tooltip
                title="Use labels combined with && (AND), || (OR), and parentheses. Negation, comparison operators, and literals other than labels are not supported."
                placement="right"
              >
                <InfoOutlinedIcon fontSize="small" color="action" sx={{ cursor: 'default' }} />
              </Tooltip>
            </Box>
            <TextField
              label="Boolean Expression"
              value={formData.formula}
              onChange={handleChange('formula')}
              placeholder="Example: cs1 && cs2"
              multiline
              minRows={3}
              fullWidth
              error={!!errors.formula}
              helperText={errors.formula || 'Use labels combined with &&, || and parentheses'}
            />
            <FormControl component="fieldset">
              <FormLabel component="legend">Verification Mode</FormLabel>
              <RadioGroup row value={formData.formulaMode} onChange={handleChange('formulaMode')}>
                <FormControlLabel
                  value="exists"
                  control={<Radio />}
                  label="Reachable (∃ state satisfies formula)"
                />
                <FormControlLabel
                  value="forbid"
                  control={<Radio />}
                  label="Forbidden (no state satisfies formula)"
                />
              </RadioGroup>
            </FormControl>
          </>
        )}

        {needsPrimaryLabel && !isFormulaType && (
          <FormControl fullWidth required={!primarySelectionDisabled} error={!!errors.targetLabel}>
            <InputLabel>Target Label</InputLabel>
            <Select
              value={formData.targetLabel}
              onChange={handleChange('targetLabel')}
              label="Target Label"
              disabled={primarySelectionDisabled}
            >
              {availableLabels.length === 0 && (
                <MenuItem disabled>No labels defined in the model</MenuItem>
              )}
              {availableLabels.map((label) => (
                <MenuItem key={label} value={label}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            {errors.targetLabel && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {errors.targetLabel}
              </Typography>
            )}
          </FormControl>
        )}

        {needsSecondaryLabel && !isFormulaType && (
          <FormControl
            fullWidth
            required={!secondarySelectionDisabled}
            error={!!errors.secondaryLabel}
          >
            <InputLabel>Second Label</InputLabel>
            <Select
              value={formData.secondaryLabel}
              onChange={handleChange('secondaryLabel')}
              label="Second Label"
              disabled={secondarySelectionDisabled}
            >
              {availableLabels.filter((label) => label !== formData.targetLabel).length === 0 && (
                <MenuItem disabled>Define at least two distinct labels</MenuItem>
              )}
              {availableLabels
                .filter((label) => label !== formData.targetLabel)
                .map((label) => (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                ))}
            </Select>
            {errors.secondaryLabel && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {errors.secondaryLabel}
              </Typography>
            )}
          </FormControl>
        )}

        {isFormulaType && availableLabels.length === 0 && (
          <Alert severity="warning">
            <Typography variant="body2">
              Define labels in the model before configuring a logical formula property.
            </Typography>
          </Alert>
        )}

        {!isFormulaType && (primarySelectionDisabled || secondarySelectionDisabled) && (
          <Alert severity="warning">
            <Typography variant="body2">
              {needsSecondaryLabel
                ? 'Define at least two distinct labels in the model before configuring mutual exclusion.'
                : 'No labels defined in the current model. Please add labels in location before verification.'}
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={
            (!isFormulaType && (primarySelectionDisabled || secondarySelectionDisabled)) ||
            (isFormulaType && availableLabels.length === 0)
          }
        >
          {property ? 'Save Changes' : 'Add Property'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PropertyForm

PropertyForm.propTypes = {
  open: PropTypes.bool.isRequired,
  property: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    targetLabel: PropTypes.string,
    secondaryLabel: PropTypes.string,
    labels: PropTypes.arrayOf(PropTypes.string),
    formula: PropTypes.string,
    formulaMode: PropTypes.oneOf(['exists', 'forbid']),
    formulaLabels: PropTypes.arrayOf(PropTypes.string)
  }),
  availableLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

PropertyForm.defaultProps = {
  property: null
}
